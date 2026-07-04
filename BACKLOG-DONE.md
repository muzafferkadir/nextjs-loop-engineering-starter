# BACKLOG-DONE.md — Completed Features

Merged features land here, newest first, as 2–3-line summaries + PR
link — the full spec lives in the PR. This keeps BACKLOG.md lean (the
loop reads it every run) while the Planner can still grep completed
work for precedent when scoping new features.

---

### F-004: Task Due Dates ✅
**PR:** https://github.com/muzafferkadir/nextjs-loop-engineering-starter/pull/2
- Nullable `dueDate` column on `tasks`, optional date input in
  `TaskForm`, overdue styling in `TaskItem`
- `isOverdue`/`formatDueDate` helpers with unit, component, and e2e
  coverage; verifier APPROVE

### F-003: Deterministic Seed & E2E Rig ✅
**Shipped in the initial codebase.**
- Fixed-fixture seed (`src/db/seed.ts`), Playwright with pinned
  viewport/locale/timezone, `pnpm snap` for visual inspection

### F-002: Task CRUD ✅
**Shipped in the initial codebase.**
- Create with priority, cycle status, soft delete — all via Server Actions
- Reference implementation for the action pattern: `src/app/tasks/actions.ts`
- Unit + e2e coverage

### F-001: Auth (sessions) ✅
**Shipped in the initial codebase.**
- Register, login, logout with httpOnly cookie sessions (hashed in DB)
- `src/lib/auth.ts` — denylisted, human-only from here on
