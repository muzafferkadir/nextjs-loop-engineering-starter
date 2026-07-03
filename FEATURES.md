# FEATURES.md — Feature Backlog

The loop agent takes work from this file. States:
- **Backlog** — not started
- **WIP** — being implemented right now (lock acquired)
- **Review** — PR open, waiting for human review
- **Done** — completed

---

## Backlog

_(empty)_

<!-- Feature format — copy this block into the Backlog and give it the
     next F-number. Acceptance criteria are exactly what the loop
     implements and what the verifier enforces: keep them concrete and
     checkable. For UI features keep the `pnpm snap` line; for schema
     changes note that human approval is required (see LOOP.md).

### F-101: Dashboard Summary
**Priority:** High
**Description:** Signed-in users see a summary of their tasks above the list.
**Acceptance criteria:**
- Total task count and a To do / In progress / Done breakdown
- The 5 most recently updated tasks
- Empty state when the user has no tasks
- Server Component — no client-side fetching
- Unit test for the aggregation logic, e2e for the rendered summary
- `pnpm snap /tasks` output visually inspected

-->

---

## WIP

### F-101: Tasks Summary
**Priority:** High
**Description:** Signed-in users see a compact task summary above the Tasks list.
**Acceptance criteria:**
- Summary appears above the task list on `/tasks`
- Shows total task count and a To do / In progress / Done breakdown for the signed-in user's non-deleted tasks
- Empty-state-compatible summary when the user has no tasks
- Server Component data flow — no client-side fetching
- Unit test for the aggregation logic and e2e coverage for the rendered summary
- `pnpm snap /tasks` output visually inspected

---

## Review

_(no PRs waiting for human review)_

---

## Done

### F-001: Auth (sessions) ✅
**Shipped in the initial codebase.**
- Register, login, logout with httpOnly cookie sessions (hashed in DB)
- `src/lib/auth.ts` — denylisted, human-only from here on

### F-002: Task CRUD ✅
**Shipped in the initial codebase.**
- Create with priority, cycle status, soft delete — all via Server Actions
- Reference implementation for the action pattern: `src/app/tasks/actions.ts`
- Unit + e2e coverage

### F-003: Deterministic Seed & E2E Rig ✅
**Shipped in the initial codebase.**
- Fixed-fixture seed (`src/db/seed.ts`), Playwright with pinned
  viewport/locale/timezone, `pnpm snap` for visual inspection

---

## Loop Agent Rules

1. **Pick ONE feature from Backlog** — never from Done or WIP
2. **Acquire the lock:** `bash scripts/loop-lock.sh acquire F-XXX`
3. **Move it to WIP** (in this file)
4. **Implement every acceptance criterion** — no skipping
5. **Visually inspect UI changes** — `$ui-verify` / `pnpm snap`
6. **Pass the verifier:** `bash scripts/run-verifier.sh F-XXX` must APPROVE
7. **Open a PR** per the git protocol in AGENTS.md
8. **Move to Review, release the lock:** `bash scripts/loop-lock.sh release`
