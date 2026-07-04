# BACKLOG.md — Feature Backlog

The loop agent takes work from this file. States:
- **Ideas** — raw, unspecced (the Planner turns these into Backlog features)
- **Backlog** — specced, not started
- **WIP** — being implemented right now (lock acquired)
- **Review** — PR open, waiting for human review
- **Done** — merged; entries live in BACKLOG-DONE.md

---

## Ideas

_(one-line raw ideas — the Planner (`$loop-plan`) specs them into
Backlog features; oversized ideas get split only with human approval)_

---

## Backlog

_(empty — add your features here using the format below)_

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

### F-005: Task List Filter
**Priority:** Medium
**Description:** Signed-in users can filter the task list on `/tasks` by
status and priority. Similar in scope to F-002 (Task CRUD): one route,
no schema change, server-rendered.
**Acceptance criteria:**
- Status filter (All / Todo / In progress / Done) and priority filter
  (All / Low / Medium / High) controls above the task list
- Selected filters are reflected in the URL (e.g. `?status=&priority=`)
  and combine with AND when both are set
- Filtering happens in the Server Component's query via `searchParams`
  — no client-side fetching
- Distinct empty state when filters match zero tasks ("No tasks match
  your filters") vs. the existing "no tasks yet" empty state
- Unit test for the filter query-condition logic, e2e test selecting
  status/priority and asserting the filtered results, `pnpm snap
  /tasks?status=in_progress` output visually inspected

---

## Review

_(nothing in review)_

---

## Done

_(merged features move to BACKLOG-DONE.md as 2–3-line summaries + PR
link — the full spec lives in the PR)_

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
9. **After the PR merges** (you, or the next triage run): move the entry
   from Review to BACKLOG-DONE.md as a 2–3-line summary + PR link — the
   full spec lives in the PR. This file stays lean; the Planner greps
   BACKLOG-DONE.md for precedent.
