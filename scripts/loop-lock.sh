#!/usr/bin/env bash
# Loop lock — prevents two agents from working on features concurrently.
# Lock format: FEATURE | RUN_ID | TIMESTAMP | PID
# Usage: bash scripts/loop-lock.sh [acquire F-XXX | release | status | stale-check]

LOCK_FILE="loop.lock"
STATE_FILE="STATE.md"
STALE_HOURS=2  # a lock held longer than this is stale
ACTION="${1:-status}"
FEATURE="${2:-}"
RUN_ID="${RANDOM}-$$"

lock_age_hours() {
  local LOCK_TIME
  LOCK_TIME=$(cut -d'|' -f3 < "$LOCK_FILE" | tr -d ' ')
  [ -z "$LOCK_TIME" ] && { echo 999; return; }
  local NOW LOCK_EPOCH
  NOW=$(date -u +%s)
  LOCK_EPOCH=$(date -u -d "$LOCK_TIME" +%s 2>/dev/null \
    || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LOCK_TIME" +%s 2>/dev/null \
    || echo 0)
  echo $(( (NOW - LOCK_EPOCH) / 3600 ))
}

case "$ACTION" in
  acquire)
    if [ -z "$FEATURE" ]; then
      echo "Usage: $0 acquire <feature-id>"
      exit 1
    fi

    if [ -f "$LOCK_FILE" ]; then
      AGE_HOURS=$(lock_age_hours)
      if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
        echo "⚠️  Stale lock detected (${AGE_HOURS}h old) — clearing"
        rm -f "$LOCK_FILE"
      else
        echo "❌ Lock held by: $(cut -d'|' -f1 < "$LOCK_FILE" | tr -d ' ') (${AGE_HOURS}h ago)"
        echo "   Another agent is working — do not proceed."
        exit 1
      fi
    fi

    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "$FEATURE | $RUN_ID | $TIMESTAMP | $$" > "$LOCK_FILE"
    sed -i.bak "s/Active feature: .*/Active feature: $FEATURE/" "$STATE_FILE" 2>/dev/null && rm -f "$STATE_FILE.bak"
    echo "✅ Lock acquired: $FEATURE (run: $RUN_ID)"
    ;;

  release)
    if [ ! -f "$LOCK_FILE" ]; then
      echo "⚠️  No lock held"
      exit 0
    fi
    echo "🔓 Released: $(cat "$LOCK_FILE")"
    rm -f "$LOCK_FILE"
    sed -i.bak "s/Active feature: .*/Active feature: none/" "$STATE_FILE" 2>/dev/null && rm -f "$STATE_FILE.bak"
    ;;

  status)
    if [ -f "$LOCK_FILE" ]; then
      echo "🔒 Locked: $(cat "$LOCK_FILE")"
    else
      echo "🔓 No active lock — free to acquire"
    fi
    ;;

  stale-check)
    if [ -f "$LOCK_FILE" ]; then
      AGE_HOURS=$(lock_age_hours)
      if [ "$AGE_HOURS" -ge "$STALE_HOURS" ]; then
        echo "⚠️  STALE LOCK: ${AGE_HOURS}h old — human review required"
        exit 1
      else
        echo "✅ Lock fresh: ${AGE_HOURS}h old (< ${STALE_HOURS}h threshold)"
      fi
    else
      echo "✅ No lock"
    fi
    ;;

  *)
    echo "Usage: $0 [acquire <feature-id> | release | status | stale-check]"
    exit 1
    ;;
esac
