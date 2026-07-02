# STATE.md — Loop Memory

Last run: —
Loop: Daily Triage (L1)
Active feature: none

<!-- Kill switch: change "active" to "paused" on the line below to stop all loops. -->
loop: active

## High Priority

_(items needing intervention today — the loop fills this in)_

## Watch List

_(items that may need action soon — the loop fills this in)_

## Waiting on Human

_(escalations — if anything sits here longer than 24h, check in)_

## Resolved (last 7 days)

_(closed items — the loop prunes entries older than 7 days)_

---

## L1 Calibration Notes

After each triage run the loop appends a row per item; a human fills in
the "Human" column. Score with `bash scripts/l1-score.sh`.

<!-- Example:
### Run 1 — 2026-07-01
| Item | Loop verdict | Human verdict | Result |
|---|---|---|---|
| CI red on main | High Priority | High Priority | TP |
-->
