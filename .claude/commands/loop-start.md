---
description: "Start the loop engineering workflow — triage (L1) or feature development (L2)"
argument-hint: "[l1|l2]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

Read the following files in order:
1. AGENTS.md — project context, stack, rules
2. LOOP.md — active loops, budget, denylist
3. STATE.md — current state (if it says `loop: paused`, STOP immediately)
4. FEATURES.md — feature backlog

Then based on the argument:

**If the argument is "l1" or empty:**
Run the $loop-triage skill:
- Check open PRs, CI status, FEATURES.md
- Update STATE.md (High Priority, Watch List, Resolved)
- Append to loop-run-log.md
- DO NOT write code

**If the argument is "l2":**
Run the $loop-fix skill:
- Check the lock: `bash scripts/loop-lock.sh status`
- If free: acquire the lock, pick the highest-priority Backlog item
- Implement all acceptance criteria with tests
- Visually inspect UI changes with the $ui-verify skill
- Run the verifier: `bash scripts/run-verifier.sh` — must APPROVE
- Open a PR per the git protocol in AGENTS.md
- Release the lock

Always run `bash scripts/budget-check.sh` at the start and end.
