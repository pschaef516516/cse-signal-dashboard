---
phase: 03-dashboard-polish-ux
plan: "02"
subsystem: browse-tab-redesign
tags: [browse, granularity, filter-pills, date-range, ux]
dependency_graph:
  requires: [03-01]
  provides: [BrowseFilterPill, dateRanges-utility, BrowseTab-granularity, fetchSignalsByRange, fetchPostsByRange]
  affects: [src/components/ui/BrowseTab.jsx, src/api/supabase.js]
tech_stack:
  added: []
  patterns: [useRef-click-outside, cancellation-flag-useEffect, derived-filter-state, granularity-tab-bar]
key_files:
  created:
    - src/utils/dateRanges.js
    - src/components/ui/BrowseFilterPill.jsx
  modified:
    - src/components/ui/BrowseTab.jsx
    - src/api/supabase.js
decisions:
  - "Week/Month use native <select> with human-readable labels (no custom picker library)"
  - "Filter state lives inside BrowseTab — self-contained, not lifted to App.jsx"
  - "displayedSignals (post-filter) passed to onSignalClick so modal Prev/Next navigates filtered list"
  - "Switching granularity resets all four filter pills to null"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-30"
  tasks_completed: 3
  files_changed: 4
---

# Phase 03 Plan 02: Browse Tab Redesign Summary

**One-liner:** Added Day/Week/Month/All Time granularity tabs to BrowseTab with four signal filter pills (Source, Severity, Type, Confidence), backed by new dateRanges.js utility and fetchSignalsByRange/fetchPostsByRange API functions.

## What Was Built

### src/utils/dateRanges.js (new)
A date range utility module with no external dependencies:
- `getRecentWeeks(count)` — returns last N ISO week strings ('YYYY-WXX'), most recent first
- `getWeekRange(isoWeek)` — returns `{ start: Date, end: Date }` for Mon 00:00:00 through Sun 23:59:59
- `getRecentMonths(count)` — returns last N 'YYYY-MM' strings, most recent first
- `getMonthRange(yearMonth)` — returns `{ start: Date, end: Date }` for first through last day of month
- `filterByRange(rows, range, dateField)` — client-side filter helper
- `formatWeekRangeLabel(isoWeek)` — "Apr 20 – Apr 26"
- `formatMonthLabel(yearMonth)` — "April 2026"
- `getTodayRange()` / `getYesterdayRange()` — convenience helpers for future plans
- Internal `getISOWeekLabelLocal` mirrors `getISOWeekLabel` from aggregate.js to avoid circular import

### src/api/supabase.js (modified)
- Updated `fetchPosts()` select string to include `author_profile_url`, `post_url`, `record_type` (needed by the All Time tab's posts table)
- Added `fetchSignalsByRange(startISO, endISO)` — fetches all 37 signal columns within a datetime range, used by Week and Month granularity
- Added `fetchPostsByRange(startDate, endDate)` — fetches posts within a date-only range

### src/components/ui/BrowseFilterPill.jsx (new)
Reusable pill button component:
- Props: `{ label, options, value, onChange }`
- Blue filled pill when `value !== null`; gray outlined when inactive
- `useRef` + `useEffect` click-outside detection closes dropdown on external click
- Dropdown renders "All (clear)" item to reset filter, then one button per option
- Selected option highlighted with blue text (`#0057FF`) and light blue background (`#F0F5FF`)
- No className — inline styles with Compass design tokens throughout

### src/components/ui/BrowseTab.jsx (redesigned)
Major changes to the component:
- **New state:** `granularity` ('day'|'week'|'month'|'all'), `selectedWeek`, `selectedMonth`, four filter states
- **Granularity tab bar** replaces the old single date picker panel — four underline-style tabs
- **Day tab** retains the existing date picker, still defaults to yesterday
- **Week tab** shows a native `<select>` with labels like "Apr 20 – Apr 26"
- **Month tab** shows a native `<select>` with labels like "April 2026"
- **All Time tab** calls `fetchSignals()` + `fetchPosts()` with no date constraint (D-09)
- **useEffect** updated to branch on `granularity`, using cancellation flag pattern throughout
- **Filter reset useEffect** clears all four pills when granularity tab changes
- **`displayedSignals`** derived array applies all four filters to `signalsForDate`
- **Filter pills row** rendered above signals table, shows "N of M" count when filters active
- **Signal row `onClick`** passes `displayedSignals` (post-filter) to `onSignalClick` so modal Prev/Next navigates the filtered list
- **Posts section** unchanged — no filter pills (D-07)

## New State Shape in BrowseTab

```js
const [granularity, setGranularity] = useState('day')   // 'day' | 'week' | 'month' | 'all'
const [selectedDate, setSelectedDate] = useState(yesterdayString())
const [selectedWeek, setSelectedWeek] = useState(null)   // 'YYYY-WXX' or null
const [selectedMonth, setSelectedMonth] = useState(null) // 'YYYY-MM' or null

const [sourceFilter, setSourceFilter] = useState(null)
const [severityFilter, setSeverityFilter] = useState(null)
const [typeFilter, setTypeFilter] = useState(null)
const [confidenceFilter, setConfidenceFilter] = useState(null)
```

## Deviations from Plan

None — plan executed exactly as written. All task actions matched the spec without requiring auto-fixes or architectural changes.

## Success Criteria Check

- [x] `src/utils/dateRanges.js` exists with all required exports (getRecentWeeks, getWeekRange, getRecentMonths, getMonthRange, filterByRange, formatWeekRangeLabel, formatMonthLabel)
- [x] `supabase.js` exports `fetchSignalsByRange` and `fetchPostsByRange`
- [x] `src/components/ui/BrowseFilterPill.jsx` exists and handles click-outside correctly
- [x] BrowseTab shows Day/Week/Month/All Time tabs — Day default
- [x] Week and Month show native selects with human-readable labels
- [x] Filter pills filter only the signals section (posts section unaffected)
- [x] Signal row click passes `displayedSignals` (post-filter) to `onSignalClick`
- [x] `npm run build` passes (built in 137ms, no errors)

## Known Stubs

None — all state is fully wired. Week/Month selects are populated from real computed date ranges, not hardcoded values.

## Threat Surface Scan

No new network endpoints or auth paths introduced beyond what is in the plan's threat model (T-03-02-01 through T-03-02-03). Date range strings passed to PostgREST are computed from `getWeekRange`/`getMonthRange` outputs — not from raw user text input — mitigating T-03-02-01.

## Self-Check: PASSED

- src/utils/dateRanges.js — FOUND
- src/components/ui/BrowseFilterPill.jsx — FOUND
- src/components/ui/BrowseTab.jsx — FOUND (granularity tabs + filter pills)
- src/api/supabase.js — FOUND (fetchSignalsByRange, fetchPostsByRange)
- Commits: 3cf6a5d (Task 1), 9b40fbd (Task 2), f93598a (Task 3) — all present in git log
- Build: passed (built in 137ms, no errors)
