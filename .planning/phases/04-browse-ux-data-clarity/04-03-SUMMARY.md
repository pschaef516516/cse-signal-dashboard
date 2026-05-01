---
phase: 04-browse-ux-data-clarity
plan: "03"
subsystem: PipelineTab
tags: [pipeline, ux, stat-card, copy]
dependency_graph:
  requires: []
  provides: [pipeline-delay-note]
  affects: [src/components/ui/PipelineTab.jsx]
tech_stack:
  added: []
  patterns: [BigStat sub prop, static string constant]
key_files:
  created: []
  modified:
    - src/components/ui/PipelineTab.jsx
decisions:
  - Sub string is unconditional — applies on all time filter selections per D-08
  - Middle dot separator used to combine existing text with new delay note per plan spec
  - No new conditional logic added; styling delegated entirely to existing BigStat sub render per D-09
metrics:
  duration: "~3 minutes"
  completed: "2026-05-01"
  tasks_completed: 1
  files_changed: 1
---

# Phase 04 Plan 03: Pipeline Delay Note Summary

Single-string update to the Posts Ingested BigStat sub prop in PipelineTab.jsx, adding "Updated daily through yesterday" to clarify the India scraping team's one-day ingestion lag.

## What Was Done

**Task 1: Update Posts Ingested BigStat sub prop**

Changed line 56 of `src/components/ui/PipelineTab.jsx`:

Before:
```jsx
sub="All-time community posts scraped"
```

After:
```jsx
sub="All-time community posts scraped · Updated daily through yesterday"
```

No other changes were made to the file. No conditional logic was added. The sub prop is a static string constant that renders on every time filter selection.

## Acceptance Criteria Verification

- `grep -c "Updated daily through yesterday" src/components/ui/PipelineTab.jsx` returned `1`
- "All-time community posts scraped" appears on the same `sub=` line as the delay note (line 56)
- No ternary, no `if`/`?:` logic around the sub prop
- `npm run build` exits 0

## No Conditional Logic Added

Per D-08, the sub text is unconditional. The Posts pipeline always lags one day behind regardless of the selected time filter, so the note is always accurate. The BigStat component's existing sub paragraph render handles the styling automatically (fontSize 12, color #6B7487 — D-09).

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None. This is a static string change with no data flow, no user input, and no API surface affected (T-04-03: accepted).

## Self-Check

- [x] `src/components/ui/PipelineTab.jsx` modified — verified
- [x] Commit `653f137` exists — verified
- [x] `npm run build` exits 0 — verified
- [x] No conditional logic added — verified

## Self-Check: PASSED
