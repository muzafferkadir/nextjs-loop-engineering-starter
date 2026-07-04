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
