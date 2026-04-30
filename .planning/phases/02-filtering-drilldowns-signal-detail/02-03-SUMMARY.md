---
plan: 02-03
status: complete
wave: 2
tasks_completed: 2
commits:
  - 732ee02 feat(02-03): add onBarClick to CommunityChart, SignalVolumeChart, SeverityChart
  - 858bda9 feat(02-03): add EnrollmentUpsellSplitChart and EUCommunityChart (clickable)
---

## Summary

Added optional `onBarClick` prop to three existing charts and created two new E&U charts.

## What Was Built

### Task 1 — Chart onClick handlers (backward compatible)
- `CommunityChart.jsx` — accepts `onBarClick(sourceName)`, cursor pointer when active
- `SignalVolumeChart.jsx` — accepts `onBarClick(weekLabel)` on all three stacked bars (churn/enrollment/upsell)
- `SeverityChart.jsx` — accepts `onBarClick(severityLevel)` on the severity bar

All three remain backward-compatible: omitting `onBarClick` renders identically to before.

### Task 2 — New E&U charts
- `EnrollmentUpsellSplitChart.jsx` — stacked bar chart of enrollment vs upsell volume by week (D-13, presentational only)
- `EUCommunityChart.jsx` — horizontal grouped bar of enrollment/upsell by source (D-12), with `onBarClick(sourceName)` on BOTH bars per cross-AI review fix (D-05)

## Self-Check: PASSED

- `npm run build` — 0 errors, 586 modules transformed
- `npm test` — 25/25 tests pass
- All 5 charts contain `onBarClick` where required
- No `dangerouslySetInnerHTML` in any chart file
- Color tokens match UI-SPEC (#0057FF enrollment, #623CC9 upsell, #D81860 churn)

## Key Files

**created:**
- src/components/charts/EnrollmentUpsellSplitChart.jsx
- src/components/charts/EUCommunityChart.jsx

**modified:**
- src/components/charts/CommunityChart.jsx
- src/components/charts/SignalVolumeChart.jsx
- src/components/charts/SeverityChart.jsx

## Enables

Plan 04 (App.jsx wiring) can now import all charts and wire `onBarClick` handlers to open the SignalDrawer with filtered signals.
