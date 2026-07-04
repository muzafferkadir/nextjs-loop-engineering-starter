---
name: "source-command-loop-start"
description: "Start the loop engineering workflow — triage (Report mode) or feature development (Build mode)"
---

# source-command-loop-start

Use this skill when the user asks to run the migrated source command `loop-start`.

## Command Template

Read the following files in order:
1. AGENTS.md — project context, stack, rules
2. LOOP.md — loop lifecycle, limits, denylist
3. STATE.md — current state (if it says `loop: paused`, STOP immediately)
4. BACKLOG.md — feature backlog

Then based on the argument:

**If the argument is "report" or empty:**
Run the $loop-report skill:
- Check open PRs, CI status, BACKLOG.md
- Update STATE.md (High Priority, Watch List, Resolved)
- Append to loop-run-log.md
- DO NOT write code
- Commit the state update: ask first if a human is present in this
  session; if this is an unattended scheduled run, commit and push
  directly to main and report the change — no PR needed for loop memory

**If the argument starts with "plan":**
Run the $loop-plan skill with the rest of the argument as the idea
(or the top BACKLOG.md ## Ideas item if no idea is given):
- Check precedent (BACKLOG-DONE.md, loop-run-log.md, git log)
- Fits one run → spec it into the Backlog
- Too broad → propose a split and ASK THE HUMAN — never spec silently
- DO NOT write code

**If the argument is "build":**
Run the $loop-build skill:
- Sync main: `git checkout main && git pull --ff-only` — dirty tree or
  failed pull → report in STATE.md and STOP
- Check the lock: `bash scripts/loop-lock.sh status`
- If free: acquire the lock, pick the highest-priority Backlog item
- Implement all acceptance criteria with tests
- Visually inspect UI changes with the $ui-verify skill
- Run the verifier: `bash scripts/run-verifier.sh` — must APPROVE
- Open a PR per the git protocol in AGENTS.md
- Release the lock

Always run `bash scripts/budget-check.sh` at the start and end.
