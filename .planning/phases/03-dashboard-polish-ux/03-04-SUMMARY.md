---
phase: 03-dashboard-polish-ux
plan: "04"
subsystem: frontend
tags: [pipeline-tab, recharts, new-component, app-routing]
dependency_graph:
  requires:
    - 03-01  # SignalModal (modal nav exists for other tabs)
  provides:
    - PipelineTab component
    - Fourth tab in dashboard tab bar
  affects:
    - src/App.jsx
    - src/components/ui/PipelineTab.jsx
tech_stack:
  added: []
  patterns:
    - Recharts LineChart for conversion rate trend
    - Reuse of existing PostsVsSignalsChart and CommunityChart components
    - Local Panel component pattern (matches App.jsx)
key_files:
  created:
    - src/components/ui/PipelineTab.jsx
  modified:
    - src/App.jsx
decisions:
  - "PipelineTab uses all-time data — no time filter applied (D-14)"
  - "isPipeline guard added alongside isBrowse to hide FilterPills and Churn/E&U content"
  - "CommunityChart reused for posts-by-source by passing posts array — both posts and signals have a source column"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-30"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 04: Pipeline Tab Summary

## One-liner

New Pipeline tab with PostsVsSignalsChart, weekly conversion rate LineChart, and posts-by-source CommunityChart — always shows all-time data, no filter pills.

## What Was Built

Added a fourth tab labeled "Pipeline" to the CSE Signal Dashboard. The tab shows three panels:

1. **Posts Ingested vs Signals Generated** — reuses PostsVsSignalsChart with the full signals and posts arrays.
2. **Signal Conversion Rate (%) by Week** — a new Recharts LineChart built locally in PipelineTab.jsx. Computes weekly conversion rate as `signals / (signals + posts) * 100` using groupByWeek from aggregate.js.
3. **Posts Ingested by Source** — reuses CommunityChart, passing posts instead of signals. Works because both share a `source` column.

The Pipeline tab has no FilterPills (D-14). FilterPills is now hidden when `isPipeline` is true (same pattern as `isBrowse`). The Churn/E&U stat cards and charts are also guarded with `!isBrowse && !isPipeline` so they don't render on the Pipeline tab.

## PostsVsSignalsChart Props Interface

The component signature matched expectations exactly:
- `PostsVsSignalsChart({ signals, posts })` — signals uses `created_at`, posts uses `captured_date`
- No adjustments needed.

## CommunityChart with Posts Data

CommunityChart worked correctly with the posts array. The component normalizes `source` via `normalizeSource()` and calls `countByField(normalized, 'source')`. Posts have a `source` column, so no adjustments were needed. `onBarClick={undefined}` disables drill-down on Pipeline tab per D-14.

## Success Criteria

- [x] PipelineTab.jsx exists and exports a default component
- [x] TABS array in App.jsx has four entries with Pipeline last
- [x] Pipeline tab renders three panels without errors
- [x] FilterPills does not appear on Pipeline tab
- [x] Churn/E&U stat cards do not render on Pipeline tab
- [x] npm run build passes

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create PipelineTab.jsx | 33db42e | src/components/ui/PipelineTab.jsx (new) |
| 2 | Wire PipelineTab into App.jsx | a712225 | src/App.jsx |

## Self-Check: PASSED

- `src/components/ui/PipelineTab.jsx` — exists
- `33db42e` — found in git log
- `a712225` — found in git log
- npm run build — passes (596 modules, no errors)
