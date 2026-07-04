# LOOP.md — Loop Configuration

## Active Loops

| Pattern | Cadence | Mode | Status |
|---------|---------|------|--------|
| Daily Triage | 1d | Report | Active |

## Loop Lifecycle

Every Build (feature) run is one plan-execute-verify loop:

1. **Sync & lock** — `git checkout main && git pull --ff-only`. A dirty
   working tree or a failed pull → notify the human in STATE.md and STOP.
   Then read BACKLOG.md, take the highest-priority Backlog item, acquire
   the loop lock (`scripts/loop-lock.sh`), move it to WIP.
2. **Plan** — read the feature's acceptance criteria and the AGENTS.md
   rules; create the `feature/F-XXX-short-name` branch off fresh main.
   Every feature gets its own branch — never commit to main.
3. **Execute** — implement the criteria one by one, each with its test;
   visually inspect UI changes (ui-verify skill).
4. **Verify** — run the independent verifier: `pnpm verify`. APPROVE is
   the only exit from the loop.
5. **Correct** — on REJECT, fix in the same session using the reject
   reasons as feedback; track the attempt count in STATE.md.
6. **Finish or escalate** — on APPROVE: open a PR, release the lock, log
   the run. At Max rejects or the per-run budget: escalate under
   "Waiting on Human" in STATE.md and stop.

Features enter the Backlog through the Planner
(`.claude/skills/loop-plan/SKILL.md`): it turns a short idea into
concrete acceptance criteria, uses past similar work (BACKLOG-DONE.md,
loop-run-log.md, git log) to decide whether the idea fits ONE run, and
splits oversized ideas into smaller features — a split is only added to
the Backlog after human approval.

Full procedures: `.claude/skills/loop-plan/SKILL.md` (Planner),
`.claude/skills/loop-fix/SKILL.md` (Build) and
`.claude/skills/loop-triage/SKILL.md` (Report — triage only, no code).

## Limits

All loop limits live in this section — the budget lines are parsed by
scripts, so this is the single source of truth (like the denylist).

- Per-run limit: 5,000,000 tokens (one run = one session, cost-weighted —
  cache reads count at 10%)
- Daily limit: 50,000,000 tokens (all loops combined)
- Alert at: 40,000,000 tokens per day (warn, then finish the current run)
- Max rejects: 5 (verifier REJECTs on one feature → escalate and stop)
- Kill switch: write `loop: paused` into STATE.md

Usage is measured, not self-reported: a Stop hook
(scripts/hooks/log-usage.mjs) records real transcript usage into
.loop/usage/, and scripts/budget-check.sh reads it (run-log estimates
are only a fallback — the check always uses the higher number).

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
- Max rejects reached on one item (see ## Limits) → escalate and stop
- Splitting a broad idea into multiple features → the Planner proposes,
  a human approves
- Anything touching a denylist path → human does it

## Multi-Loop Coordination

If more than one loop runs on this project:
- Priority: CI fix → PR babysitter → feature development → triage
- Two agents never touch the same file concurrently (loop.lock locally,
  plus a git ref on origin so locks are visible across clones/worktrees —
  see scripts/loop-lock.sh)
- The daily token budget is shared across all loops

## Report → Build Transition Criteria

- At least 10 stable Report (triage) runs logged in loop-run-log.md
- You read STATE.md after each run and trust the triage calls (human judgment)
- Verifier self-test passes: `bash scripts/verifier-self-test.sh`
- ## Limits reviewed against real .loop/usage/ data
- Denylist enforcement verified (self-test covers this)

## Notes

- Planner (on demand): spec ONE idea into the BACKLOG.md Backlog — no code
- Report mode (first ~10 days): update STATE.md and BACKLOG.md only — no code
- Build mode: pick ONE feature from the BACKLOG.md Backlog, implement,
  pass the verifier
- Append a summary to loop-run-log.md after every run
