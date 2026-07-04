#!/usr/bin/env bash
# Budget check — per-run and daily token spend against LOOP.md ## Limits.
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
BUDGET="LOOP.md"
TODAY=$(date -u +%Y-%m-%d)
USAGE_DIR=".loop/usage/$TODAY"

DAILY_LIMIT=$(grep "Daily limit:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')
ALERT_AT=$(grep "Alert at:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')
PER_RUN_LIMIT=$(grep "Per-run limit:" "$BUDGET" 2>/dev/null | grep -oE "[0-9,]+" | head -1 | tr -d ',')

[ -z "$DAILY_LIMIT" ] && DAILY_LIMIT=50000000
[ -z "$ALERT_AT" ] && ALERT_AT=40000000
[ -z "$PER_RUN_LIMIT" ] && PER_RUN_LIMIT=5000000

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

# Per-run check — each run is one session and the Stop hook keeps that
# session's .tokens file current, so the largest file today is the
# biggest single run. Exceeding it is an escalation: the loop stays
# stopped until a human clears it (or the UTC day rolls over).
MAX_RUN=$(cat "$USAGE_DIR"/*.tokens 2>/dev/null | sort -n | tail -1)
MAX_RUN=${MAX_RUN:-0}

echo "📊 Budget status — $TODAY"
echo "   Used today:  $TODAY_TOKENS / $DAILY_LIMIT tokens ($SOURCE)"
echo "   Largest run: $MAX_RUN / $PER_RUN_LIMIT tokens (per-run limit)"

if [ "$MAX_RUN" -ge "$PER_RUN_LIMIT" ]; then
  echo "🛑 PER-RUN LIMIT EXCEEDED — one run used $MAX_RUN tokens (>= $PER_RUN_LIMIT)"
  echo "   Stop the run and escalate under 'Waiting on Human' in STATE.md."
  exit 1
elif [ "$TODAY_TOKENS" -ge "$DAILY_LIMIT" ]; then
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
