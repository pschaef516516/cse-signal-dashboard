---
phase: 05-claude-ai-analysis
plan: "02"
subsystem: ui
tags: [react, anthropic, ai-insights, useEffect, aggregation]

dependency_graph:
  requires:
    - phase: 05-01
      provides: api/analyze.js serverless function and @anthropic-ai/sdk installed
  provides:
    - src/components/ui/AIInsightsTab.jsx — self-contained AI Insights tab component
    - buildSummary helper — produces D-05 aggregated summary object from raw signals
    - Dual-path fetch — dev calls Anthropic SDK directly, prod calls /api/analyze
  affects:
    - 05-03 (App.jsx integration — imports and mounts AIInsightsTab)

tech-stack:
  added: []
  patterns:
    - local-panel-definition (Panel defined in each tab file, not exported from App.jsx)
    - dual-path-dev-prod-fetch (import.meta.env.DEV branches to direct SDK call vs serverless POST)
    - pre-aggregated-ai-summary (buildSummary collapses raw rows to a small object before sending to Claude)

key-files:
  created:
    - src/components/ui/AIInsightsTab.jsx
  modified: []

key-decisions:
  - "Dual-path fetch: dev uses VITE_ANTHROPIC_API_KEY + dangerouslyAllowBrowser so npm run dev works without vercel dev; prod POSTs to /api/analyze"
  - "buildSummary is module-level (not inside component) and immutable — no mutation of signals array"
  - "analysis state cached in component — if already loaded, re-mounting tab does not re-trigger Claude"
  - "Panel defined locally per project pattern (not imported from App.jsx which does not export it)"

patterns-established:
  - "Panel inline pattern: copy Panel definition into each tab component file rather than importing from App.jsx"
  - "Loading/error/analysis/empty four-state render: each state renders independently inside Panel"

requirements-completed:
  - D-02
  - D-03
  - D-04
  - D-05
  - D-06
  - D-07
  - D-08
  - D-09

duration: ~10min
completed: 2026-05-01
---

# Phase 05 Plan 02: AIInsightsTab Component Summary

**Self-contained AIInsightsTab.jsx that auto-runs Claude Haiku analysis on mount using a dual-path fetch (VITE key in dev, /api/analyze in prod) and renders the response in a Panel with loading/error/empty states.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-01T19:45:00Z
- **Completed:** 2026-05-01T19:49:59Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Created `src/components/ui/AIInsightsTab.jsx` (137 lines) — fully self-contained, no new state in App.jsx
- `buildSummary` aggregates signals to the exact D-05 shape (total, matched, match rate, high-severity, churn/enrollment split, top 3 sources, top 3 categories)
- Dual-path fetch: dev calls Anthropic SDK directly with `VITE_ANTHROPIC_API_KEY` and `dangerouslyAllowBrowser: true`; prod POSTs to `/api/analyze`
- All four render states handled: loading ("Analyzing signals..."), error (red text), analysis (pre-wrap prose), empty (no analysis yet)

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Create AIInsightsTab.jsx with dual-path fetch and buildSummary | a7296c4 | feat |

## Files Created/Modified

- `src/components/ui/AIInsightsTab.jsx` — AI Insights tab component with buildSummary, dual-path fetch, Panel, four-state render

## Decisions Made

1. **Dual-path fetch** — Dev uses `VITE_ANTHROPIC_API_KEY` + `dangerouslyAllowBrowser: true` so `npm run dev` works without `vercel dev`. Prod POSTs to `/api/analyze`. This matches the locked D-09 decision and avoids requiring the Vercel CLI for local development.

2. **buildSummary at module level** — Placed outside the component as a pure function. Follows CLAUDE.md immutability rule; no mutation of the signals array.

3. **Analysis caching in component state** — `runAnalysis()` guards with `if (analysis || loading) return`. Re-mounting the tab after initial load does not re-trigger Claude. Matches RESEARCH.md A3 recommendation.

4. **Panel defined locally** — Copied verbatim from PipelineTab.jsx lines 5-14 per the PATTERNS.md panel pattern. App.jsx does not export Panel.

## Deviations from Plan

None — plan executed exactly as written. File contents match the specification in the plan's `<action>` block precisely.

## Issues Encountered

None. Build passed on first attempt. The chunk size warning (634 kB) is pre-existing from recharts and was not introduced by this plan.

## Known Stubs

None. The component is fully wired:
- `buildSummary` computes from real `signals` prop data
- Dev path calls real Anthropic API (requires `VITE_ANTHROPIC_API_KEY` in `.env.local`)
- Prod path calls real `api/analyze.js` serverless function (built in Plan 01)

The only prerequisite before the tab is visible to the user is Plan 03 (App.jsx integration).

## Threat Flags

None. The `/api/analyze` endpoint was already introduced and documented in Plan 01. No new network endpoints or auth paths introduced by this component.

## User Setup Required

For local dev: add `VITE_ANTHROPIC_API_KEY=<your-key>` to `.env.local`. This is the dev-only escape hatch documented in `.env.example`.

For production: `ANTHROPIC_API_KEY` must be set in Vercel project settings (documented in Plan 01).

## Next Phase Readiness

- `AIInsightsTab.jsx` is complete and ready to be imported into App.jsx
- Plan 03 adds the `ai` tab to the TABS array, the `isAI` boolean, and the `{isAI && <AIInsightsTab signals={signals} />}` block
- No blockers

## Self-Check: PASSED

- [x] `src/components/ui/AIInsightsTab.jsx` exists (137 lines)
- [x] Commit a7296c4 exists
- [x] `export default function AIInsightsTab` present
- [x] `function buildSummary` present
- [x] `import.meta.env.DEV` present (dual-path guard)
- [x] `VITE_ANTHROPIC_API_KEY` present
- [x] `fetch('/api/analyze'` present (prod path)
- [x] `claude-haiku-4-5-20251001` present (model ID)
- [x] `dangerouslyAllowBrowser: true` present
- [x] `Analyzing signals` present (loading state)
- [x] `Content-Type` present (Pitfall 5 guard)
- [x] `match_method !== 'not_found'` present
- [x] `severity === 'high'` present
- [x] `countByField` present (import + 2 calls = 3 occurrences)
- [x] `stream: true` NOT present
- [x] `npm run build` exits 0

---
*Phase: 05-claude-ai-analysis*
*Completed: 2026-05-01*
