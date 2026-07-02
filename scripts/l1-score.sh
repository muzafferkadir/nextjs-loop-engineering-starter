#!/usr/bin/env bash
# L1 calibration score — extracts the calibration notes from STATE.md.
# Fill in the "Human" column in STATE.md first, then run this.
# Usage: bash scripts/l1-score.sh

STATE_FILE="STATE.md"

if [ ! -f "$STATE_FILE" ]; then
  echo "❌ STATE.md not found"
  exit 1
fi

echo "📊 L1 Calibration Score"
echo "========================"
echo ""
grep -A 30 "L1 Calibration" "$STATE_FILE" || echo "(No calibration notes yet)"
echo ""
echo "How to score:"
echo "  Precision = TP / (TP + FP) — of what the loop flagged, how much mattered?"
echo "  Recall    = TP / (TP + FN) — of what mattered, how much did the loop find?"
echo ""
echo "L2 readiness: both ≥ 0.85 across at least 10 triage runs."
