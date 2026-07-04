#!/usr/bin/env bash
# Loop state consistency check — validates BACKLOG.md, STATE.md, loop.lock.
# Runs in CI to catch loop system violations.
# Usage: bash scripts/check-loop-state.sh

FEATURES="BACKLOG.md"
STATE="STATE.md"
LOCK="loop.lock"
FAILED=0

echo "🔍 Loop state consistency check"
echo ""

# 1. WIP entries require a lock (local file or remote git ref)
WIP_ITEMS=$(awk '/^## WIP/{found=1; next} /^## /{found=0} found && /^###/{print}' "$FEATURES" 2>/dev/null | wc -l | tr -d ' ')
if [ "$WIP_ITEMS" -gt 0 ] && [ ! -f "$LOCK" ] \
   && ! bash scripts/loop-lock.sh status 2>/dev/null | grep -q "🔒 Remote lock:"; then
  echo "❌ WIP item(s) in BACKLOG.md but no lock exists (local or remote)"
  echo "   Either acquire the lock or move WIP back to Backlog"
  FAILED=1
else
  echo "✅ WIP/lock consistent"
fi

# 2. Active feature in STATE.md must exist in BACKLOG.md
STATE_FEATURE=$(grep "Active feature:" "$STATE" 2>/dev/null | awk '{print $3}' | tr -d ' ')
if [ -n "$STATE_FEATURE" ] && [ "$STATE_FEATURE" != "none" ]; then
  if ! grep -q "$STATE_FEATURE" "$FEATURES" 2>/dev/null; then
    echo "❌ STATE.md active feature '$STATE_FEATURE' not found in BACKLOG.md"
    FAILED=1
  else
    echo "✅ STATE.md active feature found in BACKLOG.md"
  fi
fi

# 3. Lock and STATE.md must agree
if [ -f "$LOCK" ]; then
  LOCK_FEATURE=$(cut -d'|' -f1 < "$LOCK" | tr -d ' ')
  if [ "$LOCK_FEATURE" != "$STATE_FEATURE" ]; then
    echo "❌ loop.lock feature ($LOCK_FEATURE) ≠ STATE.md active ($STATE_FEATURE)"
    FAILED=1
  else
    echo "✅ Lock and STATE.md agree"
  fi
fi

# 4. Stale lock check
if [ -f "$LOCK" ]; then
  bash scripts/loop-lock.sh stale-check 2>/dev/null || {
    echo "❌ Stale lock detected — needs human review"
    FAILED=1
  }
fi

# 5. Build-mode guard — warn if feature work starts before 10 logged Report runs
REPORT_RUN_COUNT=$(grep -c "^## [0-9]" loop-run-log.md 2>/dev/null || echo 0)
if [ "$WIP_ITEMS" -gt 0 ] && [ "$REPORT_RUN_COUNT" -lt 10 ]; then
  echo "⚠️  Build mode attempted with only $REPORT_RUN_COUNT logged Report runs (recommended ≥10)"
  echo "   Watch ~10 Report (triage) runs before starting Build feature work"
  # Warning only — Build readiness is a human call
fi

# 6. Budget configured
BUDGET_LIMIT=$(grep "Daily limit:" LOOP.md 2>/dev/null | grep -oE "[0-9,]+" | head -1)
if [ -z "$BUDGET_LIMIT" ]; then
  echo "⚠️  LOOP.md ## Limits has no daily limit set"
else
  echo "✅ Budget limit set: $BUDGET_LIMIT tokens/day"
fi

# 7. Kill switch — anchored to line start so prose or comments that
# merely mention the phrase don't trip it
if grep -q "^loop: paused" "$STATE" 2>/dev/null; then
  echo "🛑 LOOP PAUSED — kill switch active in STATE.md"
  exit 1
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ Loop state consistent"
else
  echo "❌ Loop state inconsistent — fix before continuing"
  exit 1
fi
