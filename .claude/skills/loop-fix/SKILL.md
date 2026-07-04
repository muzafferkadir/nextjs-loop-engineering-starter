---
name: loop-fix
description: Implements exactly one feature from the FEATURES.md Backlog — syncs main, acquires the loop lock, creates a feature branch, implements all acceptance criteria with tests, visually inspects UI changes, passes the independent verifier, and opens a PR. Use for Assisted-mode loop runs, or when asked to "implement a feature", "work the backlog", or "run assisted mode".
---

# loop-fix — Assisted Mode Skill (plan-execute-verify)

Implement ONE feature from the FEATURES.md Backlog. Nothing else.

---

## Workflow

### 1. Prepare (sync main + acquire the lock)
- If STATE.md contains `loop: paused` — stop.
- Sync main first:
  ```bash
  git checkout main && git pull --ff-only
  ```
  **Dirty working tree or failed pull → do not touch anything.** Report
  it under "Waiting on Human" in STATE.md and STOP.
- Read FEATURES.md — pick the highest-priority Backlog feature.
- Check the lock:
  ```bash
  bash scripts/loop-lock.sh status
  ```
  - **Held:** another agent is working. STOP and report in STATE.md.
  - **Free:**
    ```bash
    bash scripts/loop-lock.sh acquire F-XXX
    ```
- Move the feature Backlog → WIP in FEATURES.md.
- Read AGENTS.md — stack, code rules, git protocol.

### 2. Implement
- New branch: `feature/F-XXX-short-name`
- Implement the acceptance criteria one by one, each with its test
  (unit for logic, e2e for user-visible flows — see AGENTS.md test rules)
- Follow the reference patterns:
  - Server Action: `src/app/tasks/actions.ts`
  - Route structure (`loading.tsx`, `error.tsx`): `src/app/tasks/`
  - UI primitives and tokens: `src/components/ui/`, AGENTS.md "UI Conventions"
- Smallest possible diff. One PR = one feature. Do not "improve" unrelated
  code — implement exactly the acceptance criteria.

### 3. Look at what you changed
For any UI change, run the `$ui-verify` skill:
dev server + `pnpm snap <routes>` + Read the PNGs. Fix what looks wrong
*before* invoking the verifier — the verifier checks correctness, your
eyes check design.

### 4. Verify
```bash
bash scripts/run-verifier.sh F-XXX
```
- On REJECT: fix and re-run. Track attempts in STATE.md:
  ```
  Reject count F-XXX: N
  ```
- After 5 REJECTs (Max rejects — LOOP.md ## Limits):
  1. Write `Escalation: F-XXX — <reason>` under "Waiting on Human" in STATE.md
  2. Stop the loop — wait for a human

### 5. Finish (release the lock)
- Open a PR per the AGENTS.md git protocol (include the verifier verdict)
- Move the feature WIP → Review in FEATURES.md
- ```bash
  bash scripts/loop-lock.sh release
  ```
- Append the run to loop-run-log.md

---

## Schema Change Gate

If the feature adds tables or columns:
1. Edit `src/db/schema.ts`, run `pnpm db:push` locally
2. Update `src/db/seed.ts` deterministically (fixed values only)
3. Mark the PR clearly: **contains schema change — human approval required**
4. Never auto-merge a schema-change PR

---

## Hard Rules

- ONE feature at a time
- Never commit to main — every feature lives on its own branch and
  reaches main only through a PR a human merges
- No denylist paths (LOOP.md ## Denylist) — if the feature seems to need
  one, escalate instead
- No feature is "done" without tests
- No PR without an APPROVE from the verifier
- No auto-merge — a human merges
