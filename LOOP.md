# LOOP.md — Loop Configuration

## Active Loops

| Pattern | Cadence | Level | Status |
|---------|---------|-------|--------|
| Daily Triage | 1d | L1 | Active |

## Budget

- Max tokens/day: 100,000
- Alert at: 80,000
- Kill switch: write `loop: paused` into STATE.md

## Denylist

Agents must never touch these paths. Enforced three ways: locally by the
PreToolUse hook in `.claude/settings.json`, in the verifier, and in CI —
all three read the patterns from this section, so this list is the single
source of truth.

- `.env*`
- `secrets/**`
- `src/lib/auth.ts` (session/auth changes are always a human decision)
- `drizzle/**` (generated migrations — review, don't edit)
- `.claude/settings.json` (the enforcement layer itself)
- `scripts/hooks/**` (the enforcement layer itself)
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
- Two agents never touch the same file concurrently (loop.lock)
- The token budget is shared across all loops

## L1 → L2 Transition Criteria

- At least 10 stable L1 runs logged in loop-run-log.md
- Triage accuracy ≥ 85% (precision and recall — see `scripts/l1-score.sh`)
- Verifier self-test passes: `bash scripts/verifier-self-test.sh`
- loop-budget.md filled in
- Denylist enforcement verified (self-test covers this)

## Notes

- L1 (first ~10 days): update STATE.md and FEATURES.md only — no code
- L2: pick a feature from the FEATURES.md Backlog, implement, pass the verifier
- Append a summary to loop-run-log.md after every run
