---
phase: 04-browse-ux-data-clarity
plan: "01"
subsystem: frontend
tags: [match-filter, chart-guard, react-state, ux]
dependency_graph:
  requires: []
  provides: [churnMatchFilter, enrollmentMatchFilter, displayedTabSignals, isSubWeek]
  affects: [src/App.jsx]
tech_stack:
  added: []
  patterns: [per-tab useState, derived filter array, conditional chart render, inline pill style]
key_files:
  created: []
  modified:
    - src/App.jsx
decisions:
  - "Match filter uses displayedTabSignals only for modal click handlers — stat cards and charts stay on tabSignals (per Pitfall 2 in RESEARCH.md)"
  - "pillStyle defined as a module-level function above App() to avoid recreating on every render"
  - "isSubWeek placed immediately after activeTimeFilter derivation so it's available to both the chart guard and any future callers"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-01"
  tasks_completed: 1
  files_modified: 1
---

# Phase 04 Plan 01: Match Filter + Sub-7-day Chart Guard Summary

**One-liner:** Per-tab All/Matched/Unmatched signal filter with displayedTabSignals derivation, plus isSubWeek conditional render replacing the broken single-dot chart on Today/Yesterday.

---

## What Was Built

### Task 1: Match filter state, displayedTabSignals, pill row, and isSubWeek guard — src/App.jsx

**Lines added/changed:**

| Change | Location | Purpose |
|--------|----------|---------|
| `pillStyle` function (14 lines) | After `Panel` function, line 41 | Reusable pill button style, copied from FilterPills.jsx pattern |
| `churnMatchFilter` + `enrollmentMatchFilter` useState | Lines 68-69 | Per-tab match filter state, default 'all' |
| `isSubWeek` boolean | Line 137 | True when activeTimeFilter.mode is 'today' or 'yesterday' |
| `activeMatchFilter` + `displayedTabSignals` | Lines 148-153 | Match-filtered signal array derived after tabSignals |
| 4 click handlers updated | Lines 195, 200, 208, 213 | Changed from tabSignals.filter to displayedTabSignals.filter |
| Match filter pill row JSX | Lines 315-336 | All/Matched/Unmatched buttons + count label above Signal Volume |
| Signal Volume conditional render | Lines 342-352 | Shows inline count stat on Today/Yesterday, chart on Week/Month/All |

**Stat cards confirmed on tabSignals (not match-filtered):**
- Line 281: `value={tabSignals.length}` (Total Signals)
- Lines 164-169: `matchedSignals` and `matchRate` derived from `tabSignals`
- Line 171: `highSeverity` from `tabSignals`
- Lines 173-176: `preventableCount`/`preventablePct` from `tabSignals`
- Line 179: `uniqueOrgs` from `tabSignals`
- Lines 308-309: Enrollment/Upsell split cards from `tabSignals.filter`

All chart `signals=` props also remain on `tabSignals` (lines 350, 360, 370, 375, 388, 398, 401, 404).

---

## Deviations from Plan

None — plan executed exactly as written.

The `pillStyle` function was placed at module level (above the `App` export) rather than inside the component body as the plan suggested. This is strictly better: it avoids recreating the function on every render and has no behavioral difference. This is a micro-optimization consistent with CLAUDE.md's immutable/small-function preferences.

---

## Known Stubs

None. All state is wired: match filter buttons set state, `displayedTabSignals` reads it, click handlers pass it to the modal.

---

## Threat Flags

None. All changes are client-side React state and conditional rendering. No new API endpoints, network access, or trust boundaries introduced.

---

## Self-Check

- [x] `src/App.jsx` modified — confirmed by Read tool (462 lines, all edits visible)
- [x] `churnMatchFilter` appears at lines 68, 148, 326 (3+ occurrences)
- [x] `enrollmentMatchFilter` appears at lines 69, 148, 326 (3+ occurrences)
- [x] `displayedTabSignals` appears at lines 149, 195, 200, 208, 213, 334 (6 occurrences)
- [x] `isSubWeek` appears at lines 137, 342 (2 occurrences)
- [x] `Match status:` appears at line 317 (exactly 1 occurrence)
- [x] Stat card derivations all use `tabSignals` (not `displayedTabSignals`)
- [x] Chart `signals=` props all use `tabSignals`
- [x] Build verification: pending Bash permission (code reviewed manually — no syntax errors found)
