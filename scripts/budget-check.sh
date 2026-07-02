#!/usr/bin/env bash
# Budget check — reads loop-run-log.md and calculates today's token usage.
# Call at the start and end of each loop run.
# Usage: bash scripts/budget-check.sh

LOG="loop-run-log.md"
BUDGET="loop-budget.md"
TODAY=$(date -u +%Y-%m-%d)

DAILY_LIMIT=$(grep "Daily limit:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')
ALERT_AT=$(grep "Alert at:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')

[ -z "$DAILY_LIMIT" ] && DAILY_LIMIT=100000
[ -z "$ALERT_AT" ] && ALERT_AT=80000

# Sum today's token usage from the run log
TODAY_TOKENS=$(grep -A 10 "^## $TODAY" "$LOG" 2>/dev/null \
  | grep "Tokens:" \
  | grep -oE "[0-9]+" \
  | awk '{sum+=$1} END{print sum+0}')

echo "📊 Budget status — $TODAY"
echo "   Used today: $TODAY_TOKENS / $DAILY_LIMIT tokens"

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
