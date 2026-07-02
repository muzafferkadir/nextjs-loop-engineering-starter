#!/usr/bin/env bash
# Loop lock — prevents two agents from working on features concurrently.
#
# Local lock:  loop.lock file — protects agents sharing this working copy.
# Remote lock: a git ref refs/loop-lock/<feature>.<epoch> on the remote —
#   visible across clones and worktrees. Used automatically when an
#   `origin` remote exists; disable with LOOP_LOCK_REMOTE=off, or point at
#   another remote with LOOP_LOCK_REMOTE=<name>. Remote failures (offline,
#   no push access) degrade to local-only with a loud warning.
#   Race resolution: after publishing, the acquirer re-lists the lock refs
#   and keeps the lock only if its own ref sorts first — two racing
#   acquirers resolve deterministically, the loser backs off.
#
# Lock file format: FEATURE | RUN_ID | TIMESTAMP | PID
# Usage: bash scripts/loop-lock.sh [acquire F-XXX | release | status | stale-check]

LOCK_FILE="loop.lock"
STATE_FILE="STATE.md"
STALE_HOURS=2  # a lock held longer than this is stale
REMOTE="${LOOP_LOCK_REMOTE:-origin}"
REF_PREFIX="refs/loop-lock"
ACTION="${1:-status}"
FEATURE="${2:-}"
RUN_ID="${RANDOM}-$$"

has_remote() {
  [ "$REMOTE" != "off" ] && git remote get-url "$REMOTE" >/dev/null 2>&1
}

remote_refs() {
  git ls-remote "$REMOTE" "$REF_PREFIX/*" 2>/dev/null | awk '{print $2}'
}

ref_age_hours() {
  local epoch="${1##*.}"
  case "$epoch" in ''|*[!0-9]*) echo 999; return ;; esac
  echo $(( ($(date -u +%s) - epoch) / 3600 ))
}

lock_age_hours() {
  local LOCK_TIME
  LOCK_TIME=$(cut -d'|' -f3 < "$LOCK_FILE" | tr -d ' ')
  [ -z "$LOCK_TIME" ] && { echo 999; return; }
  local NOW LOCK_EPOCH
  NOW=$(date -u +%s)
  # GNU date first; BSD date needs -u alongside -j or the Z suffix is
  # silently read as local time (which made fresh locks look hours old)
  LOCK_EPOCH=$(date -u -d "$LOCK_TIME" +%s 2>/dev/null \
    || date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$LOCK_TIME" +%s 2>/dev/null \
    || echo 0)
  echo $(( (NOW - LOCK_EPOCH) / 3600 ))
}

case "$ACTION" in
  acquire)
    if [ -z "$FEATURE" ]; then
      echo "Usage: $0 acquire <feature-id>"
      exit 1
    fi

    # Local lock
    if [ -f "$LOCK_FILE" ]; then
      AGE_HOURS=$(lock_age_hours)
      if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
        echo "⚠️  Stale local lock detected (${AGE_HOURS}h old) — clearing"
        rm -f "$LOCK_FILE"
      else
        echo "❌ Lock held by: $(cut -d'|' -f1 < "$LOCK_FILE" | tr -d ' ') (${AGE_HOURS}h ago)"
        echo "   Another agent is working — do not proceed."
        exit 1
      fi
    fi

    # Remote lock (cross-clone visibility)
    if has_remote; then
      EXISTING=$(remote_refs | head -1)
      if [ -n "$EXISTING" ]; then
        AGE_HOURS=$(ref_age_hours "$EXISTING")
        if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
          echo "⚠️  Stale remote lock (${AGE_HOURS}h old) — clearing $EXISTING"
          git push -q "$REMOTE" ":$EXISTING" 2>/dev/null || true
        else
          echo "❌ Remote lock held: $EXISTING (${AGE_HOURS}h ago)"
          echo "   Another clone/worktree is working — do not proceed."
          exit 1
        fi
      fi
      MY_REF="$REF_PREFIX/$FEATURE.$(date -u +%s)"
      if git push -q "$REMOTE" "HEAD:$MY_REF" 2>/dev/null; then
        WINNER=$(remote_refs | sort | head -1)
        if [ "$WINNER" != "$MY_REF" ]; then
          echo "❌ Lost the lock race to $WINNER — backing off"
          git push -q "$REMOTE" ":$MY_REF" 2>/dev/null || true
          exit 1
        fi
        echo "✅ Remote lock published: $MY_REF"
      else
        # Push failed — distinguish a lost race from being offline
        if RAW=$(git ls-remote "$REMOTE" "$REF_PREFIX/*" 2>/dev/null); then
          if [ -n "$RAW" ]; then
            echo "❌ Lost the lock race — a remote lock appeared:"
            echo "   $(echo "$RAW" | awk '{print $2}' | head -1)"
            exit 1
          fi
          echo "⚠️  Remote lock push failed (no push access?) — LOCAL lock only"
        else
          echo "⚠️  Could not reach $REMOTE (offline?) — LOCAL lock only"
        fi
        echo "   Cross-clone safety not guaranteed for this run."
      fi
    fi

    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "$FEATURE | $RUN_ID | $TIMESTAMP | $$" > "$LOCK_FILE"
    sed -i.bak "s/Active feature: .*/Active feature: $FEATURE/" "$STATE_FILE" 2>/dev/null && rm -f "$STATE_FILE.bak"
    echo "✅ Lock acquired: $FEATURE (run: $RUN_ID)"
    ;;

  release)
    RELEASE_FEATURE=""
    if [ -f "$LOCK_FILE" ]; then
      RELEASE_FEATURE=$(cut -d'|' -f1 < "$LOCK_FILE" | tr -d ' ')
      echo "🔓 Released: $(cat "$LOCK_FILE")"
      rm -f "$LOCK_FILE"
      sed -i.bak "s/Active feature: .*/Active feature: none/" "$STATE_FILE" 2>/dev/null && rm -f "$STATE_FILE.bak"
    else
      echo "⚠️  No local lock held"
    fi
    # Only delete remote refs for the feature we actually held — another
    # agent's lock is never ours to clear (a stale one is cleared by the
    # next acquire).
    if has_remote && [ -n "$RELEASE_FEATURE" ]; then
      for REF in $(remote_refs | grep "^$REF_PREFIX/$RELEASE_FEATURE\." || true); do
        if git push -q "$REMOTE" ":$REF" 2>/dev/null; then
          echo "🔓 Remote lock removed: $REF"
        else
          echo "⚠️  Could not remove remote lock $REF — remove it manually"
        fi
      done
    elif has_remote; then
      R=$(remote_refs | head -1)
      [ -n "$R" ] && echo "ℹ️  Remote lock $R left in place (no local lock to prove ownership)"
    fi
    ;;

  status)
    if [ -f "$LOCK_FILE" ]; then
      echo "🔒 Locked: $(cat "$LOCK_FILE")"
    else
      echo "🔓 No local lock"
    fi
    if has_remote; then
      R=$(remote_refs | head -1)
      if [ -n "$R" ]; then
        echo "🔒 Remote lock: $R ($(ref_age_hours "$R")h old)"
      else
        echo "🔓 No remote lock"
      fi
    fi
    ;;

  stale-check)
    STALE=0
    if [ -f "$LOCK_FILE" ]; then
      AGE_HOURS=$(lock_age_hours)
      if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
        echo "⚠️  STALE LOCAL LOCK: ${AGE_HOURS}h old — human review required"
        STALE=1
      else
        echo "✅ Local lock fresh: ${AGE_HOURS}h old (< ${STALE_HOURS}h threshold)"
      fi
    else
      echo "✅ No local lock"
    fi
    if has_remote; then
      R=$(remote_refs | head -1)
      if [ -n "$R" ]; then
        AGE_HOURS=$(ref_age_hours "$R")
        if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
          echo "⚠️  STALE REMOTE LOCK: $R (${AGE_HOURS}h old) — human review required"
          STALE=1
        else
          echo "✅ Remote lock fresh: ${AGE_HOURS}h old"
        fi
      else
        echo "✅ No remote lock"
      fi
    fi
    exit "$STALE"
    ;;

  *)
    echo "Usage: $0 [acquire <feature-id> | release | status | stale-check]"
    exit 1
    ;;
esac
