---
name: loop-plan
description: Planner — turns a short feature idea into a detailed FEATURES.md spec before any Assisted run. Checks past similar work to decide whether the idea fits one loop run; if it is too broad, proposes a split into smaller features and asks the human to approve. Use when asked to "plan a feature", "spec this idea", "run the planner", or before adding anything to the Backlog.
---

# loop-plan — Planner Skill (spec before code)

Turn ONE short idea into a sprint contract: concrete, checkable
acceptance criteria in FEATURES.md. **Write no code. Open no PRs.**

---

## Workflow

### 1. Take the idea
- Input: the idea handed to you directly, or the top item under
  `## Ideas` in FEATURES.md.
- If STATE.md contains `loop: paused` — stop.

### 2. Study precedent — has similar work been done?
- FEATURES.md `## Done` — similar features, their criteria count and scope
- loop-run-log.md — how many runs/rejects comparable features took
- `git log --oneline -20` — the shape of comparable diffs

A feature similar to one already delivered in a single run is the
strongest "fits one run" signal.

### 3. Size decision — does it fit ONE loop run?
"Fits one run" means all of:
- ≤ 5 acceptance criteria, every one testable
- One area of the app (one route/component cluster + its data)
- No schema change combined with large UI work
- Comparable to a past single-run feature (step 2)

**Fits → step 4. Too broad → step 5.**

### 4. Write the spec (fits one run)
- Draft the F-XXX entry with the next free F-number, using the template
  in FEATURES.md: concrete, checkable acceptance criteria; keep the
  `pnpm snap` line for UI features; flag schema changes (human approval
  per LOOP.md Human Gates).
- Add it to FEATURES.md `## Backlog` with a priority and a precedent
  note ("similar to F-YYY, delivered in one run"). Remove the idea from
  `## Ideas` if it came from there.
- Append one line to loop-run-log.md (`— Planner`).

### 5. Split proposal (too broad) — ask the human
- Break the idea into the smallest set of independently shippable
  features, each passing the step-3 size test, ordered so that earlier
  features never depend on later ones.
- **Do NOT add them to the Backlog yet.**
- Get approval:
  - Interactive session → present the split (each proposed F-XXX with a
    one-line scope) and ask directly.
  - Unattended run → write the proposal under "Waiting on Human" in
    STATE.md and stop.
- Only after human approval: add the approved features to `## Backlog`.

---

## Never Do

- Write code or tests, open PRs (the Planner plans; the Generator builds)
- Move items to WIP (that's Assisted-mode work)
- Touch denylist paths (LOOP.md ## Denylist)
- Silently split a broad idea — a split always gets human sign-off
- Inflate scope: spec exactly the idea, not adjacent "improvements"
