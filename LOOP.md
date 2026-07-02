# LOOP.md — Loop Configuration

## Active Loops

| Pattern | Cadence | Level | Status |
|---------|---------|-------|--------|
| Daily Triage | 1d | L1 | Active |

## Budget

- Max tokens/day: 100,000 (cost-weighted — cache reads count at 10%)
- Alert at: 80,000
- Kill switch: write `loop: paused` into STATE.md
- Measured, not self-reported: a Stop hook (scripts/hooks/log-usage.mjs)
  records real transcript usage into .loop/usage/, and
  scripts/budget-check.sh reads it (run-log estimates are only a fallback —
  the check always uses the higher number)

## Denylist

Agents must never touch these paths. Enforced three ways: locally by the
PreToolUse hook wired in .claude/settings.json (direct file edits **and**
Bash write commands such as sed -i or output redirects; fail-closed if
this list is unreadable), in the verifier, and in CI — all three read the
backtick-quoted patterns from this section, so this list is the single
source of truth. The enforcement surface protects itself: this file, the
guard scripts, CI, and the hook wiring are all listed, so an agent cannot
weaken the rules it runs under. Changes to any of these paths are made by
a human, committed directly to main.

- `.env*`
- `secrets/**`
- `src/lib/auth.ts` (session/auth changes are always a human decision)
- `drizzle/**` (generated migrations — review, don't edit)
- `LOOP.md` (this config and the denylist itself)
- `.claude/settings.json` (the hook wiring)
- `scripts/**` (guard scripts, hooks, and the verifier pipeline)
- `.github/**` (CI runs the verifier — part of the enforcement)
- `.loop/**` (measured budget records)
- `*.pem`
- `*.key`

## Human Gates

- No auto-merge — a human merges every PR
- Database schema changes → human approval before merge
- Major dependency bumps → human decision
- 3 failed fix attempts on one item → escalate and stop
- Anything touching a denylist path → human does it

## Multi-Loop Coordination

If more than one loop runs on this project:
- Priority: CI fix → PR babysitter → feature development → triage
- Two agents never touch the same file concurrently (loop.lock locally,
  plus a git ref on origin so locks are visible across clones/worktrees —
  see scripts/loop-lock.sh)
- The token budget is shared across all loops

## L1 → L2 Transition Criteria

- At least 10 stable L1 runs logged in loop-run-log.md
- You read STATE.md after each run and trust the triage calls (human judgment)
- Verifier self-test passes: `bash scripts/verifier-self-test.sh`
- loop-budget.md filled in
- Denylist enforcement verified (self-test covers this)

## Notes

- L1 (first ~10 days): update STATE.md and FEATURES.md only — no code
- L2: pick a feature from the FEATURES.md Backlog, implement, pass the verifier
- Append a summary to loop-run-log.md after every run
