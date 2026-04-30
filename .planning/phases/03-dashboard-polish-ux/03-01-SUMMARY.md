---
phase: 03-dashboard-polish-ux
plan: "01"
subsystem: signal-modal
tags: [modal, navigation, ux, signal-detail]
dependency_graph:
  requires: []
  provides: [SignalModal, modal-state-in-App]
  affects: [App.jsx, SignalDetail.jsx, BrowseTab.jsx]
tech_stack:
  added: []
  patterns: [inline-styles, useEffect-keyboard-handler, conditional-render]
key_files:
  created:
    - src/components/ui/SignalModal.jsx
  modified:
    - src/App.jsx
    - src/components/ui/SignalDetail.jsx
    - src/components/ui/BrowseTab.jsx
decisions:
  - "Replaced drawer state (4 vars) with modal state (3 vars: modalOpen/modalSignals/modalIndex)"
  - "BrowseTab passes signalsForDate as second arg to onSignalClick for full list navigation"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-30"
  tasks_completed: 3
  files_changed: 4
---

# Phase 03 Plan 01: Signal Navigator Modal Summary

**One-liner:** Replaced right-side SignalDrawer with a centered SignalModal (700px) featuring Prev/Next navigation, keyboard controls, and backdrop/X/Escape close — wired to all chart click handlers and Browse tab.

## What Was Built

### SignalModal.jsx (new)
A centered modal component that replaces SignalDrawer entirely. Features:
- Backdrop overlay (rgba dark, zIndex 1000) that closes on click
- Modal card (700px, zIndex 1001) centered with transform translate(-50%,-50%)
- Header with Prev (←) and Next (→) arrow buttons, a position counter ("N of M signals"), and an X close button
- Prev/Next arrows disabled (grayed) at list boundaries
- Scrollable body rendering `<SignalDetail signal={signals[currentIndex]} onBack={null} />`
- Keyboard handler via useEffect: Escape closes, ArrowLeft/ArrowRight navigate
- Inline styles only, Compass design tokens throughout

### SignalDetail.jsx (minor guard)
Wrapped the "← Back to signals" button in `{onBack && (...)}` so it hides when rendered inside SignalModal with `onBack={null}`. No other changes.

### App.jsx (state swap + wiring)
- Removed: `SignalDrawer`, `SignalDetail`, `SignalCardList` imports
- Added: `SignalModal` import
- Replaced 4 drawer state vars with 3 modal state vars: `modalOpen`, `modalSignals`, `modalIndex`
- Replaced `openDrawer` / `closeDrawer` / `openSignalDetail` with `openModal` / `closeModal`
- Updated all three chart click handlers to call `openModal(filtered, 0)`
- Updated BrowseTab `onSignalClick` to accept `(signal, allSignals)` and open modal with full list
- Replaced `<SignalDrawer>` JSX block with `<SignalModal>` as last child of root div

### BrowseTab.jsx (deviation fix)
Signal row click previously called `onSignalClick(s)` with only the single signal. Updated to call `onSignalClick(s, signalsForDate)` so the modal receives the full list of signals for the selected date and can navigate Prev/Next through all of them.

## Key Implementation Details

**State shape in App.jsx:**
```js
const [modalOpen, setModalOpen] = useState(false)
const [modalSignals, setModalSignals] = useState([])
const [modalIndex, setModalIndex] = useState(0)
```

**openModal helper:**
```js
function openModal(filteredSignals, startIndex = 0) {
  setModalSignals(filteredSignals)
  setModalIndex(startIndex)
  setModalOpen(true)
}
```

**SignalModal renders null when closed or signals is empty** — safe to always render at the bottom of App.jsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] BrowseTab was only passing single signal to onSignalClick**
- **Found during:** Post-task review of BrowseTab.jsx after Task 3
- **Issue:** BrowseTab row click called `onSignalClick(s)` with one arg. App.jsx handler expected `(signal, allSignals)`. Without the second arg, `allSignals` would be undefined, `list` would fall back to `[signal]`, and the modal would always show "1 of 1 signals" in Browse — defeating D-04 (Prev/Next through all signals for the selected date).
- **Fix:** Updated both `onClick` and `onKeyDown` in BrowseTab to call `onSignalClick(s, signalsForDate)`
- **Files modified:** src/components/ui/BrowseTab.jsx
- **Commit:** 2cb8078

## Success Criteria Check

- [x] SignalModal.jsx exists and exports a default function component
- [x] SignalDetail.jsx back button is wrapped in `{onBack && (...)}`
- [x] App.jsx has no reference to SignalDrawer, openDrawer, closeDrawer, or selectedSignal
- [x] `npm run build` completes without errors
- [x] Modal opens from all three chart click handlers (Community, Week, Severity)
- [x] Modal opens from Browse tab row clicks with full list navigation
- [x] Escape, backdrop click, and X button all close the modal

## Known Stubs

None — all modal state is fully wired. SignalDetail renders real signal data from Supabase.

## Self-Check: PASSED

- src/components/ui/SignalModal.jsx — FOUND
- src/components/ui/SignalDetail.jsx — FOUND (onBack guard applied)
- src/App.jsx — FOUND (no drawer references)
- src/components/ui/BrowseTab.jsx — FOUND (passes allSignals)
- Commits: 7395daa, 8d0412c, fbab652, 2cb8078 — all present in git log
- Build: passed (✓ built in ~180ms, no errors)
