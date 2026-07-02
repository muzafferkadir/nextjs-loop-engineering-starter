#!/usr/bin/env bash
# Budget check — daily token spend against the caps in loop-budget.md.
#
# Primary source (measured): .loop/usage/<utc-date>/*.tokens — written by
# the Stop hook (scripts/hooks/log-usage.mjs) from real transcript usage,
# cost-weighted (cache reads count at 10%).
# Fallback (self-reported): "Tokens:" lines under today's entries in
# loop-run-log.md. The check uses whichever number is HIGHER, so an agent
# cannot lower its bill by under-reporting.
#
# Usage: bash scripts/budget-check.sh

LOG="loop-run-log.md"
BUDGET="loop-budget.md"
TODAY=$(date -u +%Y-%m-%d)
USAGE_DIR=".loop/usage/$TODAY"

DAILY_LIMIT=$(grep "Daily limit:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')
ALERT_AT=$(grep "Alert at:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')

[ -z "$DAILY_LIMIT" ] && DAILY_LIMIT=100000
[ -z "$ALERT_AT" ] && ALERT_AT=80000

# Measured usage (Stop hook) — sum of today's per-session totals
MEASURED=$(cat "$USAGE_DIR"/*.tokens 2>/dev/null | awk '{s+=$1} END{print s+0}')

# Self-reported usage (run log) — legacy fallback
REPORTED=$(grep -A 10 "^## $TODAY" "$LOG" 2>/dev/null \
  | grep "Tokens:" \
  | grep -oE "[0-9]+" \
  | awk '{sum+=$1} END{print sum+0}')

if [ "$MEASURED" -ge "$REPORTED" ]; then
  TODAY_TOKENS=$MEASURED
  SOURCE="measured — Stop hook"
else
  TODAY_TOKENS=$REPORTED
  SOURCE="self-reported — run log"
fi
if [ "$MEASURED" -eq 0 ] && [ "$REPORTED" -eq 0 ]; then
  SOURCE="no usage recorded yet today"
fi

echo "📊 Budget status — $TODAY"
echo "   Used today: $TODAY_TOKENS / $DAILY_LIMIT tokens ($SOURCE)"

if [ "$TODAY_TOKENS" -ge "$DAILY_LIMIT" ]; then
  echo "🛑 HARD STOP — daily limit reached ($TODAY_TOKENS >= $DAILY_LIMIT)"
  echo "   Write 'loop: paused' to STATE.md and stop."
  exit 1
elif [ "$TODAY_TOKENS" -ge "$ALERT_AT" ]; then
  echo "⚠️  ALERT — approaching limit ($TODAY_TOKENS >= $ALERT_AT)"
  echo "   Consider stopping after the current run."
else
  REMAINING=$((DAILY_LIMIT - TODAY_TOKENS))
  echo "✅ Budget OK — $REMAINING tokens remaining today"
fi
