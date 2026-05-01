---
phase: 04-browse-ux-data-clarity
plan: "02"
subsystem: frontend
tags: [match-filter, scroll-bounds, react-state, ux, browse-tab]
dependency_graph:
  requires: ["04-01"]
  provides: [browseMatchFilter, browseScrollBounds]
  affects: [src/components/ui/BrowseTab.jsx]
tech_stack:
  added: []
  patterns: [per-component useState, derived filter array, 400px scroll container, inline pill style]
key_files:
  created: []
  modified:
    - src/components/ui/BrowseTab.jsx
decisions:
  - "pillStyle defined as a module-level function above BrowseTab export — avoids recreating on every render, consistent with 04-01 App.jsx pattern"
  - "Match filter pill row placed between BrowseFilterPill row and tableHeaderRowStyle div — above table header so it reads as a filter control, not a row"
  - "Header rows (tableHeaderRowStyle, postsHeaderRowStyle) stay outside scroll containers per D-02 so column labels remain visible during scroll"
  - "pillStyle copied verbatim from FilterPills.jsx rather than imported — BrowseTab.jsx is self-contained and the function is 14 lines"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-01"
  tasks_completed: 2
  files_modified: 1
---

# Phase 04 Plan 02: Browse Tab Match Filter + Scroll Bounds Summary

**One-liner:** Browse tab signals/posts capped at 400px scrollable containers with sticky column headers, plus All/Matched/Unmatched filter pills wired to AND-chained match_method predicate with granularity-reset behavior.

---

## What Was Built

### Task 1: matchFilter state, granularity reset, displayedSignals predicate — src/components/ui/BrowseTab.jsx

**Lines added/changed:**

| Change | Location | Purpose |
|--------|----------|---------|
| `matchFilter` useState | Line 153 | Match filter state, default 'all', same shape as sourceFilter/severityFilter |
| `setMatchFilter('all')` in useEffect | Line 161 (granularity reset effect) | Resets match filter whenever granularity tab changes (D-03, Pitfall 3) |
| Two match filter conditions in displayedSignals | Lines 258-259 | AND-chained with existing source/severity/type/confidence filters (D-04) |

**Filter logic:**
- `matchFilter === 'matched'`: excludes signals where `match_method` is null or `'not_found'`
- `matchFilter === 'unmatched'`: keeps only signals where `match_method === 'not_found'`
- `matchFilter === 'all'` (default): passes all signals through (return true)

### Task 2: pillStyle helper, match filter pill row UI, scroll containers — src/components/ui/BrowseTab.jsx

**Lines added/changed:**

| Change | Location | Purpose |
|--------|----------|---------|
| `pillStyle` function (14 lines) | After `previewText` helper, module level | Reusable pill button style, copied verbatim from FilterPills.jsx lines 8-19 |
| Match filter pill row JSX | Line 357-375 (signals section, below BrowseFilterPill row) | All/Matched/Unmatched buttons with active/inactive states |
| Signals scroll container | Wraps `displayedSignals.map()` only | `maxHeight: 400, overflowY: 'auto'` — header row stays outside |
| Posts scroll container | Wraps `postsForDate.map()` only | `maxHeight: 400, overflowY: 'auto'` — header row stays outside |

**Header rows confirmed outside scroll containers:**
- `tableHeaderRowStyle` div (signals column labels: Org, Signal Type, Severity, Source, Confidence, Created) — line 381, outside scroll wrapper
- `postsHeaderRowStyle` div (posts column labels: Captured, Type, Source, Author, Content Preview, Post) — outside scroll wrapper

**pillStyle source:** Defined as module-level function in BrowseTab.jsx (not imported). FilterPills.jsx does not export `pillStyle` — it uses it internally only. Defining locally is the correct approach.

---

## Deviations from Plan

None — plan executed exactly as written.

The `pillStyle` function was placed at module level (after `previewText`, before the shared inline styles block) rather than inside the component body. This is strictly better: avoids recreating on every render, consistent with the same decision made in 04-01 for App.jsx.

---

## Known Stubs

None. All state is wired: match filter buttons call `setMatchFilter`, `displayedSignals` reads `matchFilter`, the "Signals (X of Y)" count in the section title reflects the filtered subset.

---

## Threat Flags

None. All changes are client-side React state and CSS overflow. No new API endpoints, network access, or trust boundaries introduced.

---

## Self-Check

- [x] `src/components/ui/BrowseTab.jsx` modified — confirmed (2 commits: a56624f, b900f78)
- [x] `matchFilter` appears at lines 153, 258, 259, 369 (4 occurrences)
- [x] `setMatchFilter` appears at lines 153, 161, 368 (3 occurrences)
- [x] `maxHeight: 400, overflowY: 'auto'` count = 2 (one signals, one posts)
- [x] `Match status:` appears at exactly line 359 (1 occurrence)
- [x] `setMatchFilter(opt.value)` appears at exactly line 368 (1 occurrence)
- [x] `pillStyle(matchFilter === opt.value)` appears at exactly line 369 (1 occurrence)
- [x] Match filter pill row between BrowseFilterPill rows (351-354) and tableHeaderRowStyle (381)
- [x] Build: `npm run build` exits 0
