# Next.js Loop Engineering Starter

A Next.js + Tailwind CSS starter designed to be **developed by AI agents
running in loops** — with the verification, budget, and safety rails that
loop engineering requires already wired in.

The development model is simple:

```
you write features (BACKLOG.md)
        │
        ▼
the loop implements them        ← agent: lock → branch → code + tests
        │                                → screenshot → verifier
        ▼
you review and merge PRs        ← human gate: no auto-merge, ever
        │
        └──── refill the backlog and repeat
```

Stack: **Next.js 15 · React 19 · TypeScript strict · Tailwind CSS 4 ·
shadcn/ui · SQLite + Drizzle · Vitest · Playwright**. Zero external
services — no Docker, no cloud database, nothing to provision.

---

## The 60-Second Guide

Day to day you touch three things: the backlog, the loop command, and
the PR queue.

| Mode | Command | What it does |
|------|---------|--------------|
| **Plan** | `/loop-start plan <idea>` (or shortly `/loop-plan`) | Specs a one-line idea into checkable `BACKLOG.md` acceptance criteria. Writes no code. |
| **Build** | `/loop-start build` (or shortly `/loop-build`) | Implements ONE Backlog feature end-to-end (branch, tests, screenshots, verifier) and opens a PR. Never merges. |
| **Report** | `/loop-start report` (or shortly `/loop-report`) | Triages PRs/CI/backlog and updates STATE.md. Writes no code. Start here on a new project (~10 runs before trusting Build). |

1. **Spec the work** — add a feature to `BACKLOG.md` yourself (template
   inside), or run Plan mode above.
2. **Run the loop** — Report to observe first; Build once you trust it
   (see [Developing with the Loop](#developing-with-the-loop) for the
   full sequencing).
3. **Be the gate** — read the PR (verifier verdict + visual-check note
   are in the body), merge when satisfied, move the entry to
   `BACKLOG-DONE.md`, refill the backlog.

Emergency stop: set `loop: paused` in STATE.md — everything halts,
including CI. Setup: [Quickstart](#quickstart) · the full flow:
[Developing with the Loop](#developing-with-the-loop).

---

## What Makes This "Loop Ready"

| Rail | Where |
|------|-------|
| Loop memory & config | `STATE.md`, `LOOP.md`, `loop-budget.md`, `loop-run-log.md` |
| Agent instructions | `AGENTS.md` (rules), `.claude/skills/` (workflows) |
| Independent verifier | `.claude/agents/loop-verifier.md` + `pnpm verify` (same pipeline as CI) |
| Deterministic e2e | Playwright, pinned viewport/locale/timezone, seeded SQLite |
| Agent vision | `pnpm snap` screenshots pages so the agent can *see* its changes |
| Denylist enforcement | One list in `LOOP.md`, enforced by a local hook (file edits **and** Bash writes, fail-closed), the verifier, and CI |
| Kill switch & budget | `loop: paused` in STATE.md; daily cap **measured** by a Stop hook (`.loop/usage/`), not self-reported |
| Concurrency lock | `scripts/loop-lock.sh` — local file + git ref on origin, visible across clones |

---

## Quickstart

```bash
git clone https://github.com/muzafferkadir/nextjs-loop-engineering-starter.git my-project && cd my-project
pnpm install
pnpm exec playwright install chromium   # one-time, for e2e + snapshots
pnpm db:reset                           # create + seed the SQLite DB
pnpm dev                                # → http://localhost:3000
```

Demo login: `demo@example.com` / `password123`

Confirm everything is green before touching anything:

```bash
pnpm verify                             # the full verification pipeline
bash scripts/verifier-self-test.sh      # prove the verifier isn't theater
```

---

## Developing with the Loop

### Step 1 — Add a feature to BACKLOG.md

The Backlog ships empty. Open `BACKLOG.md`, copy the commented template
into the Backlog, and describe what you want:

```markdown
### F-101: Dashboard Summary
**Priority:** High
**Description:** Signed-in users see a summary of their tasks above the list.
**Acceptance criteria:**
- Total task count and a To do / In progress / Done breakdown
- Empty state when the user has no tasks
- Unit test for the aggregation logic, e2e for the rendered summary
- `pnpm snap /tasks` output visually inspected
```

Acceptance criteria are the contract: the loop implements exactly them,
and the verifier enforces exactly them. Vague criteria produce vague
features — write them concrete and checkable. Keep the `pnpm snap` line
for UI features; flag schema changes (they require human approval, see
LOOP.md → Human Gates).

Or delegate the spec work to the Planner: `/loop-start plan <one-line idea>`
(or shortly `/loop-plan <one-line idea>`), or drop the idea under
BACKLOG.md ## Ideas and let the Planner pick it up. It checks past
similar features, decides whether the idea fits a single run, writes
the acceptance criteria — and when the idea is too broad, proposes a
split into smaller features for your approval instead of speccing it
silently.

### Step 2 — Run Report mode first (observe, ~10 runs)

Don't let the loop write code on day one. Start in report-only mode:

```
/loop 1d Run $loop-report. Read STATE.md and BACKLOG.md first. No code changes.
```

Each run, the agent scans PRs/CI/backlog and updates `STATE.md`. Your
daily 5 minutes: read STATE.md and ask "would I have flagged the same
things?". After ~10 runs of triage you trust, you're ready for Build
mode — readiness is a human call.

### Step 3 — Start Build mode (the loop builds features)

```
/loop 1d Run $loop-report. Then if the Backlog has items, run $loop-build for the highest priority.
```

Or drive a single run by hand: `/loop-start build`

For each feature the agent: syncs main (`git pull --ff-only`; a dirty
tree or failed pull stops the run) → acquires the lock → moves it to
WIP → creates `feature/F-XXX-*` → implements every criterion with
tests → screenshots the UI and inspects it (`ui-verify`) → runs the
verifier (`bash scripts/run-verifier.sh` must APPROVE; 5 REJECTs → it escalates in
STATE.md and stops) → opens a PR → moves the feature to Review →
releases the lock. A human merges every PR.

### Step 4 — Review, merge, keep going

You stay in the loop as the gate:

- **Review the PR** — the verifier verdict and visual-check note are in
  the body. Merge when satisfied; there is no auto-merge.
- **Enforce the gate in GitHub** — protect `main` (Settings → Branches:
  require a pull request + the CI status check, no force pushes). "A human
  merges every PR" should be a repository setting, not a convention.
- **Move the feature to BACKLOG-DONE.md** — a 2–3-line summary + PR
  link; the full spec stays in the PR (or let the next triage do it).
- **Refill the backlog** — the loop idles safely when Backlog is empty.
- **Watch the health signals** — `loop-run-log.md` (what happened),
  `.loop/usage/` (what it cost — measured), STATE.md "Waiting on Human"
  (escalations; don't let items sit >24h).
- **Emergency stop** — set `loop: paused` in STATE.md. Everything halts,
  including CI.

---

## Commands

```bash
pnpm dev          # dev server (Turbopack)
pnpm verify       # typecheck + lint + unit + build + e2e + guards — THE gate
pnpm test         # unit tests (Vitest)
pnpm e2e          # Playwright e2e (reseeds the DB, starts its own server)
pnpm snap /tasks  # screenshot routes → .loop/screenshots/ (agent vision)
pnpm db:reset     # push schema + deterministic seed
pnpm db:studio    # Drizzle Studio
```

> Troubleshooting: if `pnpm e2e` fails with a webServer timeout, an
> orphaned dev server is usually holding port 3000 (killing the `pnpm dev`
> wrapper leaves the `next dev` child alive). Find and stop it with
> `lsof -nP -iTCP:3000 -sTCP:LISTEN`, then re-run.

---

## What Is Framework vs Example?

**Framework — keep and adapt** (the loop machinery):

```
AGENTS.md  LOOP.md  STATE.md  BACKLOG.md  BACKLOG-DONE.md  loop-run-log.md
.claude/   scripts/  .github/workflows/ci.yml
playwright.config.ts  e2e/global-setup.ts
```

**Example — replace with your product** (a small task manager that
exercises every rail: auth, CRUD, server actions, seeded e2e):

```
src/app/(login|register|tasks)/   src/components/task-*.tsx
src/db/schema.ts  src/db/seed.ts  e2e/(auth|tasks).spec.ts
```

---

## Making It Your Own

Work through these in order — each step keeps the rails intact:

1. **Reinitialize git** — this repo's history belongs to the starter,
   not your project. Disconnect it before doing anything else:
   ```bash
   rm -rf .git
   git init
   git add -A && git commit -m "chore: initial commit from nextjs-loop-engineering-starter"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. **Rename** — `package.json` name, this README's top section,
   `src/app/layout.tsx` metadata.
3. **Write your backlog** — BACKLOG.md, using the template (Step 1 above).
4. **Tune the rules** — AGENTS.md is the agent's style guide: code rules,
   UI conventions, git protocol. Whatever you don't write there, the
   agent decides for itself.
5. **Swap the example app** — recommended: let the loop do it via
   BACKLOG.md items. Keep auth (`src/lib/auth.ts` is denylisted) or
   remove it along with the middleware and its e2e; keep
   `src/db/seed.ts` **deterministic** (fixed IDs and dates — e2e and
   `pnpm snap` depend on it); update `scripts/snap.mjs` login selectors
   if your auth differs.
6. **Update the denylist — in LOOP.md only.** The local edit hook, the
   verifier, and CI all parse that one section. Then re-run
   `bash scripts/verifier-self-test.sh` (if you removed
   `src/lib/auth.ts` from the list, point self-test 4 at one of your own
   protected paths).
7. **Calibrate the limits** — LOOP.md ## Limits is the single source for
   the per-run/daily budgets and the reject cap; tune them after a week
   of real `.loop/usage/` data.
8. **Start in Report mode** — always. See Step 2 above.

### Common adjustments

| Want | Do |
|------|----|
| Postgres instead of SQLite | Swap `@libsql/client` for `pg`, change `drizzle.config.ts` dialect, update `src/db/client.ts`, set DATABASE_URL in CI |
| Persistent DB on serverless (Vercel) | Point `DATABASE_URL` at Turso (`libsql://…`) — one env change, no code change |
| More shadcn/ui components | `npx shadcn@latest add dialog dropdown-menu …` — components.json is configured |
| Preview deploys per PR | Connect the repo to Vercel; the human gate becomes "review the preview link" |
| Different agent tool (Codex, Cursor…) | The md files are tool-agnostic; move `.claude/skills/*` to your tool's skill location and re-wire the PreToolUse hook equivalent |
| A second loop (e.g. CI sweeper) | Add a row to LOOP.md "Active Loops", define a skill, mind the shared budget + lock |

---

## Loop Levels (short version)

- **Report** — the loop only triages and writes to STATE.md. Run this
  for ~10 days and read its output daily before anything else.
- **Planner** — turns a short idea into a checkable BACKLOG.md spec;
  splits oversized ideas only with your approval. Writes no code.
- **Build** — the loop implements Backlog features; every PR passes
  the independent verifier; a human merges.

This starter implements the loop engineering methodology — goal
delegation, independent verification, state persistence, and human
gates — as framed by Addy Osmani's "Loop Engineering" essay.

---

## Further Reading

Background essays this starter draws on:

| Article | Source |
|---------|--------|
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Anthropic |
| [Harness design for long-running app development](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Anthropic |
| [Agent harness engineering](https://addyosmani.com/blog/agent-harness-engineering/) | Addy Osmani |
| [What is loop engineering?](https://www.mindstudio.ai/blog/what-is-loop-engineering-ai-coding-agents) | MindStudio |
| [What is agent harness architecture?](https://www.mindstudio.ai/blog/what-is-agent-harness-architecture-explained) | MindStudio |
| [Loop engineering for AI agents](https://pub.towardsai.net/loop-engineering-for-ai-agents-building-verifiable-self-correcting-coding-workflows-8b32c72184a1) | Towards AI |
| [Claude Code in large codebases](https://code.claude.com/docs/en/large-codebases) | Claude Code Docs |

---

## License

[MIT](./LICENSE)
