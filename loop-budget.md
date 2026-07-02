# loop-budget.md — Token Budget

Daily limit: 100,000 tokens
Alert at:    80,000 tokens (warn, then finish the current run)
Hard stop:   100,000 tokens (stop, write to STATE.md, notify)

Checked by `scripts/budget-check.sh` at the start of every run, using the
per-run token entries the loop appends to loop-run-log.md.

## This Week

<!-- The loop appends one line per day:
- 2026-07-01: 12,400 tokens
-->
