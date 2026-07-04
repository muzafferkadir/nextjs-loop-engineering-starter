# FEATURES.md — Feature Backlog

The loop agent takes work from this file. States:
- **Ideas** — raw, unspecced (the Planner turns these into Backlog features)
- **Backlog** — specced, not started
- **WIP** — being implemented right now (lock acquired)
- **Review** — PR open, waiting for human review
- **Done** — completed

---

## Ideas

_(one-line raw ideas — the Planner (`$loop-plan`) specs them into
Backlog features; oversized ideas get split only with human approval)_

---

## Backlog

### F-004: Task Due Dates
**Priority:** High
**Precedent:** Similar to F-002 (Task CRUD) — a schema field addition
paired with matching form/display UI, delivered in one run.
**Description:** Users can set an optional due date when creating a
task, see it on the task item, and see at a glance when a task is
overdue.
**Acceptance criteria:**
- `tasks` schema gets a nullable `dueDate` (timestamp) column
  (schema change — flag for human review per LOOP.md Human Gates)
- `TaskForm` gets an optional date input; `createTask`'s Zod schema
  validates it as an optional valid date
- `TaskItem` displays the formatted due date when set, and visually
  marks the task as overdue (destructive-styled) when the due date is
  in the past and the task is not `done`
- Unit tests: due-date validation in the create-task schema, and an
  `isOverdue`-style helper (or equivalent logic) covering past/future/
  no-date/done cases
- Component test for `TaskItem` overdue styling; e2e coverage for
  creating a task with a due date and seeing it rendered
- `pnpm snap /tasks` output visually inspected (include a seeded
  overdue task if convenient)

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

_(nothing in progress — check the lock with: `bash scripts/loop-lock.sh status`)_

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
