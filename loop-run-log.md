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

## 2026-07-04 — Daily Triage (Report)
- Run ID: triage-20260704
- Items checked: 1 PR (merged), 1 CI run on main (green), 0 backlog
  features in WIP/Backlog
- Actions: PR #2 (F-004) confirmed merged — moved from BACKLOG.md
  Review to BACKLOG-DONE.md; STATE.md Resolved/Last run updated
- Escalations: 0
- Tokens: ~15000
- Next run: 2026-07-05

## 2026-07-04 — Planner
- Idea: "todo listesine bir filtre ekleyelim, status ve priority
  değerlerine göre filtreleme" → fits one run (precedent: F-002 Task
  CRUD — single route, no schema change). Spec'd as F-005 (Task List
  Filter), added to Backlog.

## 2026-07-04 22:57 UTC — Build (F-005)
- Feature: F-005 Task List Filter — status/priority `<select>` filters
  on `/tasks`, `parseTaskFilters` helper, filtering applied via
  `searchParams` in the Server Component's Drizzle query, distinct
  "no tasks match your filters" empty state
- Fixed a client-side race: reading `useSearchParams()` when firing two
  quick filter changes in succession dropped the first one; switched to
  building the next URL from both selects' current DOM values (refs)
- Tests: unit (`parseTaskFilters`), e2e (status filter, priority filter,
  combined filters, empty state) — all passing
- Visual check: `pnpm snap /tasks`, `/tasks?status=in_progress`,
  `/tasks?status=todo&priority=high` inspected — clean layout, correct
  filtering, correct empty state
- Verifier: APPROVE (unit, build, e2e, secret scan, `any` scan)
- PR: #3 (opened manually — `gh` CLI unavailable in-session)
- Rejects: 0 (2 local e2e fix iterations before the verifier run)
- Lock: acquired same session; held open across a session boundary
  waiting on manual PR creation, released this triage run after
  confirming the merge

## 2026-07-04 — Daily Triage (Report)
- Run ID: triage-20260704-2
- Items checked: 3 PRs (all closed: #1 F-101 closed unmerged — pre-
  existing template example, #2 F-004 merged, #3 F-005 merged), 1 CI
  run on main (in progress, not red), 0 backlog features in Backlog,
  1 in WIP (F-005, stale lock from a prior session)
- Actions: confirmed PR #3 (F-005) merged; moved F-005 from BACKLOG.md
  WIP to BACKLOG-DONE.md; released the stale F-005 loop lock; STATE.md
  Active feature/Resolved/Last run updated; backfilled the missing
  Build run log entry for F-005
- Escalations: 0
- Tokens: ~20000
- Next run: 2026-07-05
