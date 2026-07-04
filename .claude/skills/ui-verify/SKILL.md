---
name: ui-verify
description: (loop-engineering) Visually inspects UI changes by screenshotting routes with pnpm snap and reading the images against a design checklist (layout, spacing, hierarchy, semantic tokens, empty/loading/error states). Use after implementing any UI change, before opening a PR that touches src/app or src/components, or when asked "does it look right".
---

# ui-verify — Visual Inspection Skill

Look at the UI you changed, with your own eyes, before verification.
Automated checks catch broken code; this catches broken design.

---

## When

- After implementing any UI change (loop-build step 3)
- When a human asks "does it look right?"
- Before opening any PR that touches `src/app/` or `src/components/`

## How

1. **Ensure deterministic data** (skip if the DB is untouched this session):
   ```bash
   pnpm db:reset
   ```
2. **Ensure the dev server is running** (in the background):
   ```bash
   pnpm dev
   ```
3. **Screenshot the routes you changed** (and any route that shares
   changed components):
   ```bash
   pnpm snap /tasks /login
   ```
4. **Read each PNG** in `.loop/screenshots/` and inspect it against the
   checklist below.
5. **Fix and repeat** until the checklist passes, then continue to the
   verifier.

## Inspection Checklist

- Layout: nothing overflows, wraps oddly, or overlaps at 1280×800
- Alignment: elements share consistent edges; spacing follows the
  Tailwind scale (no eyeballed pixel values)
- Hierarchy: the most important element reads first; text contrast is
  sufficient (muted text only for secondary info)
- Tokens: colors look consistent with the rest of the app (semantic
  tokens — if something looks "off-palette", it's probably hardcoded)
- States: empty state, loading skeleton, and error boundary still render
  correctly if you touched them
- Both themes: if the project has dark mode, snap and check both

## Report

Summarize in one short block what you inspected and what you fixed:

```
UI verify: /tasks — fixed badge overflow on long titles; empty state OK; spacing OK.
```

Include this line in the PR body under "Visual check".
