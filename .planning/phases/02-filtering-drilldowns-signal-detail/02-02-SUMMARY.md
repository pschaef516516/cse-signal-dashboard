---
phase: 02
plan: 02
subsystem: ui-components
tags: [components, presentational, drawer, filter-pills, signal-cards]
dependency_graph:
  requires: []
  provides: [FilterPills, SignalDrawer, SignalCard, SignalCardList, SignalDetail]
  affects: [src/App.jsx (Plan 04 wiring)]
tech_stack:
  added: []
  patterns: [inline-Compass-styles, prop-drilling, pure-presentational-components]
key_files:
  created:
    - src/components/ui/FilterPills.jsx
    - src/components/ui/SignalDrawer.jsx
    - src/components/ui/SignalCard.jsx
    - src/components/ui/SignalDetail.jsx
  modified: []
decisions:
  - FilterPills uses Compass #0057FF active/inactive pill state matching UI-SPEC
  - SignalDrawer uses pointerEvents:none when closed so chart clicks work through it (Pitfall 3)
  - SignalDrawer stays in DOM at all times — never display:none — preserves CSS transition
  - formatDate and formatConfidence utilities duplicated in SignalCard and SignalDetail to keep both files standalone (no shared util needed at this scale)
metrics:
  duration: "90s"
  completed_date: "2026-04-30T13:55:15Z"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 02: Presentational UI Components Summary

Four pure presentational components built for the signal drill-down and filtering system — FilterPills (time period selector), SignalDrawer (slide-in overlay panel), SignalCard with SignalCardList (clickable signal list items), and SignalDetail (full signal metadata view with key_quote, summary, and suggested_action).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | FilterPills and SignalDrawer | e4f8d32 | src/components/ui/FilterPills.jsx, src/components/ui/SignalDrawer.jsx |
| 2 | SignalCard, SignalCardList, SignalDetail | dc6077b | src/components/ui/SignalCard.jsx, src/components/ui/SignalDetail.jsx |

## What Was Built

### FilterPills (`src/components/ui/FilterPills.jsx`)
Props: `{ value: number | null, onChange: (days: number | null) => void }`

Renders 7d / 30d / 90d / All pill buttons. Active pill uses `#0057FF` background and border; inactive pills use `#E1E6F2` border with `#6B7487` text. Purely presentational — state lives in App.jsx per D-01/D-03.

### SignalDrawer (`src/components/ui/SignalDrawer.jsx`)
Props: `{ open: boolean, title: string, onClose: () => void, children: ReactNode }`

Fixed-position overlay that slides in from the right via CSS `transform: translateX()`. Key details:
- `pointerEvents: 'none'` when closed so chart clicks pass through (prevents blocking chart interaction)
- Backdrop with `opacity` transition for smooth fade; click on backdrop calls `onClose` per D-07
- Panel width 480px, scrollable content area, always stays in DOM to preserve CSS transition

### SignalCard + SignalCardList (`src/components/ui/SignalCard.jsx`)
`SignalCard` props: `{ signal: Signal, onClick: (signal: Signal) => void }`
`SignalCardList` props: `{ signals: Signal[], onSelect: (signal: Signal) => void }`

Clickable card showing org_name, source, severity, confidence (2 decimal places), match_method, and created_at (MM/DD/YYYY format) per D-06. SignalCardList renders the collection and handles empty state with a descriptive message directing users to adjust the time period filter.

### SignalDetail (`src/components/ui/SignalDetail.jsx`)
Props: `{ signal: Signal, onBack: () => void }`

Full signal detail view rendered inside the drawer (replaces SignalCardList per D-09):
- "Back to signals" button at top per D-11 — no prev/next arrows
- Metadata block: org, source, signal_type, severity, confidence, match_method, created date
- key_quote as a styled blockquote with blue left border (`#0057FF`) and light blue background (`#F5F7FF`)
- summary as a plain paragraph
- suggested_action as a green callout card (`#F0FFF6` background, `#B3EAC8` border)

## Deviations from Plan

None — plan executed exactly as written. All components match the exact code specified in the plan actions.

## Known Stubs

None. All components are fully implemented presentational shells. They have no data source themselves — App.jsx (Plan 04) will wire real Supabase data into them. This is intentional — Plan 02 builds the shells, Plan 04 connects them.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All four components are client-side JSX rendering only.

Threat T-02-04 (XSS) mitigated: signal text fields (`key_quote`, `summary`, `suggested_action`) are rendered as JSX text children throughout. No `dangerouslySetInnerHTML` usage anywhere in `src/components/ui/`. Verified via `grep -r "dangerouslySetInnerHTML" src/components/ui/` returning no matches.

## Self-Check: PASSED

Files verified:
- src/components/ui/FilterPills.jsx: EXISTS
- src/components/ui/SignalDrawer.jsx: EXISTS
- src/components/ui/SignalCard.jsx: EXISTS
- src/components/ui/SignalDetail.jsx: EXISTS

Commits verified:
- e4f8d32: feat(02-02): add FilterPills and SignalDrawer components
- dc6077b: feat(02-02): add SignalCard, SignalCardList, and SignalDetail components

Build: npm run build exits 0.
