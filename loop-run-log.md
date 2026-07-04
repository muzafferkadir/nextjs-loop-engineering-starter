# loop-run-log.md — Run History (append-only)

Every loop run appends an entry here. Never edit or delete old entries —
this file is the audit trail that answers "what did the loop do?"

<!-- Entry format:

## 2026-07-01 09:15 UTC — Daily Triage (Report)
- Run ID: triage-20260701-091500
- Items checked: 2 PRs, 1 CI run, 4 backlog features
- Actions: STATE.md updated
- Escalations: 0
- Tokens: 12400
- Next run: 2026-07-02 09:15 UTC
-->

## 2026-07-04 13:40 UTC — Planner
- Idea: "kullanıcı görevlerine son tarih ekleyelim" → fits one run
  (precedent: F-002 Task CRUD). Spec'd as F-004 (Task Due Dates), added
  to Backlog. Schema change flagged for human review.

## 2026-07-04 13:50 UTC — Build (F-004)
- Feature: F-004 Task Due Dates — nullable `dueDate` column on `tasks`,
  optional date input in `TaskForm`, due date + overdue styling in
  `TaskItem`, `isOverdue`/`formatDueDate` helpers
- Tests: unit (validation + isOverdue/formatDueDate), component
  (TaskItem overdue styling), e2e (create with due date, seeded overdue
  task) — all passing
- Visual check: `pnpm snap /tasks` inspected — overdue task shown in
  red, done task's past due date shown muted, no-date task unaffected
- Verifier: APPROVE (typecheck, lint, unit, build, e2e, denylist,
  secret scan, `any` scan)
- PR: #2 (contains a schema change — human approval required before
  merge)
- Rejects: 0
- Lock: acquired and released cleanly
