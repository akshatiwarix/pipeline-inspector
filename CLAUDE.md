# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Day 022 of a 100-day portfolio series. A deterministic scanner that flags
stalled or risky opportunities in a synthetic open pipeline — five independent
rules (no-recent-activity, stalled-in-stage, single-threaded, close-date-
slipping, high-value-cooling), each producing evidence-linked flags with their
own severity, rolled up into a clear/watch/flagged health level. The corpus
embeds a hidden `outcomeProfile` per opportunity that the rules never read,
used only to compute a corpus-wide calibration check. **`PLAN.md` is the
contract for this repo** — it was settled with the user before any code was
written and is not a draft to improve on. If code and `PLAN.md` disagree, the
code is wrong; if `PLAN.md` needs to change, it changes there first, in
writing, with a reason. Read `PLAN.md` in full before implementing anything —
it contains the data model, the exact corpus generative model, every rule's
thresholds, the health rollup, and the numbered implementation task order
this repo is built in.

## Commands

- `npm run dev` — start the dev server.
- `npm run build` — production build.
- `npm run typecheck` — `next typegen && tsc --noEmit`.
- `npm run lint` — ESLint (flat config, `eslint-config-next`).
- `npm test` / `npm run test:watch` — vitest over `lib/**/*.test.ts` and
  `data/**/*.test.ts`.
- `npm run sweep` — `vite-node` script (`scripts/sweep.mts`) asserting the
  nine corpus-wide invariants listed in `PLAN.md` (§ Validation / test plan).
  No network.
- `npm run corpus` — regenerates the committed synthetic corpus from
  `data/generate.ts` (fixed seed; only needed if the generator changes, since
  the JSON is committed).
- Run a single test file: `npx vitest run lib/inspection/stalled-in-stage.test.ts`.

## Architecture

Five downward-only dependency layers. Nothing below `app/` may import React,
HTTP, or DOM APIs.

```
data/                 corpus generation (opportunities + activity logs, seeded RNG) + committed JSON + zod load schema
  ↓
lib/domain/            Opportunity, ActivityEntry, Contact, Evidence, Flag, Inspection, OpportunityResult, PipelineSummary, PipelineInspectionResult — types + zod
  ↓
lib/inspection/         checkNoRecentActivity, checkStalledInStage, checkSingleThreaded, checkCloseDateSlipping, checkHighValueCooling, inspectOpportunity, parseOpportunityText
  ↓
lib/pipeline-inspector/  orchestration — assembles PipelineInspectionResult, aggregates PipelineSummary (calibration by outcomeProfile)
  ↓
app/                      three screens (library, opportunity detail, try-it) + /api/v1/opportunities + /api/schema
```

Load-bearing rules (each enforced by a `npm run sweep` invariant — see `PLAN.md`):

- `lib/inspection/` is pure and deterministic: same `(opportunity, asOfDate)`
  pair ⇒ byte-identical `Inspection`. No `Date.now()` inside the module — the
  "as of" date is always an explicit parameter.
- `inspectOpportunity` must run identically in the browser (Try It Yourself)
  and on the server (precomputed library + API route) — no Node-only or
  DOM-only APIs below `app/`.
- The corpus builder always passes the fixed `ANALYSIS_DATE`; only the Try It
  Yourself page passes `new Date()` — the one intentional wall-clock read in
  the app.
- Severity is assigned inside each `check*` function, from that rule's own
  signal strength — never derived from `outcomeProfile`. `outcomeProfile` is
  read only by `data/generate.ts` and the calibration aggregate.

## Stack

Next.js (App Router) + React + TypeScript strict with `noUncheckedIndexedAccess`,
Tailwind CSS 4, zod at every boundary (API output, corpus load), vitest +
vite-node for tests/scripts, deployed on Vercel. **Zero dependency
exceptions** — no date library, no NLP library.

## Corpus

`data/generate.ts` produces the committed corpus (50 opportunities, each with
a dated activity log and a hidden `outcomeProfile`, ~40/30/30 healthy/
stalling/at-risk split) from a fixed seed. Every rule's thresholds and the
calibration formula are documented in full in `PLAN.md` (§ Method). If you
touch the generator, run `data/*.test.ts` and `npm run sweep` to confirm all
nine invariants still hold.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
