---
phase: 03-dashboard-polish-ux
plan: "03"
subsystem: time-filter-redesign
tags: [filter-pills, calendar-anchored, churn, enrollment, ux]
dependency_graph:
  requires: [03-02]
  provides: [FilterPills-calendar-anchored, filterByTimeFilter-helper]
  affects: [src/components/ui/FilterPills.jsx, src/App.jsx]
tech_stack:
  added: []
  patterns: [useRef-click-outside, calendar-anchored-filter-state, mode-dispatch-helper]
key_files:
  created: []
  modified:
    - src/components/ui/FilterPills.jsx
    - src/App.jsx
decisions:
  - "filterByTimeFilter defined inside App component (co-located with state it reads)"
  - "filterByDateRange removed from App.jsx import — fully replaced by filterByTimeFilter"
  - "Week/Month dropdown mode: 'week' with no weekValue selected shows all-time (graceful default)"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-30"
  tasks_completed: 2
  files_changed: 2
---

# Phase 03 Plan 03: Time Filter Redesign Summary

**One-liner:** Replaced rolling 7d/30d/90d filter pills on Churn and E&U tabs with calendar-anchored Today/Yesterday/Week/Month/All options backed by dropdown pickers and the dateRanges.js utility.

## What Was Built

### src/components/ui/FilterPills.jsx (rewritten)

Complete rewrite from a simple 4-button OPTIONS-array component to a five-option calendar filter bar:

- **Today** — single-click, instantly filters to the current calendar day
- **Yesterday** — single-click, filters to the previous calendar day
- **Week** — pill toggles a dropdown listing the last 12 ISO weeks as human-readable ranges (e.g. "Apr 20 – Apr 26")
- **Month** — pill toggles a dropdown listing the last 12 calendar months (e.g. "April 2026")
- **All** — clears all date filtering, shows all-time data

Props: `{ value: { mode, weekValue, monthValue }, onChange: fn }`

Click-outside detection uses the same `useRef` + `useEffect` pattern established in Plan 03-02's `BrowseFilterPill.jsx`. Both `weekRef` and `monthRef` get independent effects so the dropdowns close independently.

Active pill renders filled blue (`#0057FF`); inactive pill renders outlined gray (`#E1E6F2`). No className anywhere — inline styles with Compass design tokens throughout.

### src/App.jsx (updated)

Four targeted changes:

**New import:** `getTodayRange, getYesterdayRange, getWeekRange, getMonthRange, filterByRange` from `./utils/dateRanges`

**New state shape:**
```js
const [churnTimeFilter, setChurnTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
const [enrollmentTimeFilter, setEnrollmentTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
```

**New filterByTimeFilter helper** (defined inside App component):
```js
function filterByTimeFilter(rows, filter, dateField = 'created_at') {
  // routes: all → pass-through, today → getTodayRange, yesterday → getYesterdayRange,
  //         week → getWeekRange(weekValue), month → getMonthRange(monthValue)
}
```

**Updated filter derivation** — all three downstream arrays now go through the new helper:
```js
const activeTimeFilter = isChurn ? churnTimeFilter : enrollmentTimeFilter
const tabSignals = filterByTimeFilter(tabSignalsByType, activeTimeFilter)
const filteredPosts = filterByTimeFilter(posts, activeTimeFilter, 'captured_date')
const filteredAllSignals = filterByTimeFilter(signals, activeTimeFilter)
```

`filterByDateRange` removed from the `aggregate.js` import since it is no longer referenced.

## New Filter State Shape

```js
// mode options: 'today' | 'yesterday' | 'week' | 'month' | 'all'
{ mode: 'all', weekValue: null, monthValue: null }     // default (all-time)
{ mode: 'today', weekValue: null, monthValue: null }
{ mode: 'yesterday', weekValue: null, monthValue: null }
{ mode: 'week', weekValue: '2026-W17', monthValue: null }
{ mode: 'month', weekValue: null, monthValue: '2026-04' }
```

## Edge Cases

- **Today/Yesterday with no signals** — filterByRange returns an empty array; downstream stat cards show 0, charts render empty states. No crash.
- **Week selected but no weekValue** — filterByTimeFilter returns `rows` unchanged (graceful all-time default). This covers the transient state where Week button is opened but no option clicked yet.
- **Month selected but no monthValue** — same graceful pass-through as above.
- **Per-tab independence** — `churnTimeFilter` and `enrollmentTimeFilter` are separate useState values. Switching tabs does not reset or copy the filter; each tab remembers its own selection.

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched the spec without requiring auto-fixes or architectural changes.

## Success Criteria Check

- [x] FilterPills.jsx no longer has the 7d/30d/90d OPTIONS array
- [x] FilterPills renders Today, Yesterday, Week ↓, Month ↓, All
- [x] App.jsx state uses churnTimeFilter/enrollmentTimeFilter (not churnFilter/enrollmentFilter)
- [x] tabSignals, filteredPosts, filteredAllSignals all go through filterByTimeFilter
- [x] filterByDateRange removed from App.jsx import (no longer used)
- [x] npm run build passes (built in 127ms, no errors)
- [x] Changing Churn filter does not affect E&U filter (independent useState values)

## Known Stubs

None — all filter state is fully wired to real dateRanges.js utilities.

## Threat Surface Scan

No new network endpoints or auth paths introduced. All filtering is client-side array operations on data already in memory. Threat register items T-03-03-01 and T-03-03-02 accepted per plan — weekValue/monthValue come from getRecentWeeks/getRecentMonths outputs (computed strings), not raw user text input.

## Self-Check: PASSED

- src/components/ui/FilterPills.jsx — FOUND (rewritten, 160 lines)
- src/App.jsx — FOUND (churnTimeFilter/enrollmentTimeFilter state, filterByTimeFilter helper)
- Commits: a1e6ceb (Task 1 — FilterPills rewrite), 3c4a92e (Task 2 — App.jsx update)
- Build: passed (built in 127ms, no errors)
