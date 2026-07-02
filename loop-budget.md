# loop-budget.md — Token Budget

Daily limit: 100,000 tokens
Alert at:    80,000 tokens (warn, then finish the current run)
Hard stop:   100,000 tokens (stop, write to STATE.md, notify)

Checked by `scripts/budget-check.sh` at the start of every run. The
primary source is **measured** usage: the Stop hook
(`scripts/hooks/log-usage.mjs`) sums real API usage from the session
transcript (cost-weighted — cache reads at 10%) into
`.loop/usage/<date>/`. The per-run "Tokens:" estimates in
loop-run-log.md are only a fallback; the check always uses the higher of
the two, so under-reporting cannot stretch the budget.

## This Week

<!-- The loop appends one line per day:
- 2026-07-01: 12,400 tokens
-->
