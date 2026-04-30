---
plan: 02-04
status: complete
wave: 3
tasks_completed: 2
commits:
  - f4f4e25 feat(02-04): wire filter state, drawer, chart clicks, E&U enrichment, Browse tab
---

## Summary

Wired all Phase 02 primitives into App.jsx: filter state, drawer, chart click handlers, E&U tab enrichment, and Browse tab declaration.

## What Was Built

### Task 1 — Imports, state, derived data, FilterPills, Browse tab
- Added imports: filterByDateRange, getISOWeekLabel, FilterPills, SignalDrawer, SignalDetail, SignalCardList, EnrollmentUpsellSplitChart, EUCommunityChart
- Removed: TopOrgsTable import
- TABS array updated to 3 entries including `{ id: 'browse', label: 'Browse' }`
- New state: churnFilter, enrollmentFilter (per-tab, D-03), drawerOpen, drawerTitle, drawerSignals, selectedSignal
- Derived data rewritten: tabSignalsByType → filterByDateRange → tabSignals; filteredPosts (captured_date); filteredAllSignals
- **Cross-AI HIGH #2 fix**: uniqueOrgs now reads from tabSignals (filtered), not raw signals
- **Cross-AI HIGH #2 fix**: PostsVsSignalsChart receives filteredAllSignals + filteredPosts
- Posts Ingested stat card shows filteredPosts.length
- FilterPills rendered in header row, hidden on Browse tab via !isBrowse guard
- All churn/E&U content wrapped in {!isBrowse} fragment

### Task 2 — Drawer helpers, chart wiring, E&U enrichment, TopOrgsTable removal
- openDrawer/closeDrawer helpers (setSelectedSignal(null) on both — Pitfall 2)
- handleCommunityClick, handleWeekClick (getISOWeekLabel match — Pitfall 4), handleSeverityClick
- onBarClick wired: SignalVolumeChart, SeverityChart, CommunityChart (churn), EUCommunityChart (E&U — cross-AI HIGH #4 fix)
- TopOrgsTable removed from both tabs (D-14); Sources section is single full-width Panel
- Conditional CommunityChart vs EUCommunityChart per active tab
- E&U tab: Enrollment Signals + Upsell Signals stat cards, EnrollmentUpsellSplitChart panel (D-12, D-13)
- SignalDrawer rendered at root with SignalDetail/SignalCardList conditional on selectedSignal (D-04, D-06, D-09)

## Self-Check: PASSED

- `npm run build` — 0 errors, 591 modules transformed
- `npm test` — 25/25 tests pass
- All acceptance criteria met (TopOrgsTable=0, SignalDrawer=1, onBarClick handlers wired, Browse tab declared)

## Key Files

**modified:**
- src/App.jsx

## Enables

Plan 05 (BrowseTab.jsx) can now hang content off the existing `isBrowse` guard using a sibling `{isBrowse && <BrowseTab ... />}` block.
