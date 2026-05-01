# Phase 04: Browse UX & Data Clarity — Research

**Researched:** 2026-05-01
**Domain:** React inline-style UI patterns, client-side filter state, conditional chart rendering
**Confidence:** HIGH — all findings verified directly from the project codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Browse Tab Scroll Bounds**
- D-01: Signals section in the Browse tab gets a fixed max-height of 400px with `overflow-y: auto`. Posts section gets the same treatment. Each section scrolls independently.
- D-02: The 400px height applies to the list/table container itself — not the entire section panel including the header row.

**Matched / Unmatched Filter**
- D-03: Add All / Matched / Unmatched filter tabs (pill-style, consistent with existing filter patterns) above the signal list on: Churn tab, Enrollment & Upsell tab, and Browse tab signals section.
- D-04: "Matched" = signals where `match_method` is NOT `'not_found'`. "Unmatched" = signals where `match_method === 'not_found'`. "All" shows everything (default).
- D-05: The match filter is independent of existing filters (source, category, time period). All filters combine with AND logic.

**Signal Volume Chart — Sub-7-day Periods**
- D-06: When the selected time filter is Today or Yesterday, hide the Signal Volume area chart and replace it with a simple stat display showing total signal count for the period.
- D-07: The replacement stat should be inline/minimal — just a number with a label like "12 signals today". The chart container space can collapse or show the stat centered in its place.

**Posts Ingested Pipeline Delay**
- D-08: Add subtext note below the Posts Ingested stat card value reading: "Updated daily through yesterday". Applies on all time filter selections.
- D-09: Note styling: `fontSize: 12, color: '#6B7487'` — same as other stat card subtitles.

### Claude's Discretion
- Exact visual treatment for the collapsed chart (fade out, display: none, height: 0)
- Whether to show the match filter tabs as pills or as a segmented button control
- Whether the 400px scroll applies to the posts section in Browse too, or just signals (applying to both is fine)

### Deferred Ideas (OUT OF SCOPE)
- Claude AI Analysis — Phase 05. Fully deferred.
- StatusBadge live verification — worth a check when live data permits, not part of this phase.
- Browse collapsible sections — D-01 resolves with fixed-height scroll. No separate collapse toggle needed.
</user_constraints>

---

## Summary

Phase 04 is four targeted surgical changes to existing components. No new components need to be created from scratch — every change is a localized addition to an existing file using patterns already established in the codebase.

The two biggest changes are the match filter (requires new state in App.jsx and a new inline tab row UI in three places) and the scroll bounds (one-line CSS addition per container in BrowseTab.jsx). The chart guard and pipeline note are each single-file changes of under 10 lines.

The main planning risk is that the match filter appears in three separate locations (Churn tab, E&U tab, BrowseTab). The Churn and E&U versions are driven by App.jsx state and pre-filtered arrays. The Browse version is internal to BrowseTab.jsx and filters the already-fetched `signalsForDate` array. These are architecturally distinct and should be planned as separate tasks.

**Primary recommendation:** Plan four atomic tasks, one per decision group (scroll bounds, match filter, chart guard, pipeline note). Each task is self-contained in 1-2 files.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Browse scroll bounds | Frontend component | — | Pure CSS change inside BrowseTab.jsx containers |
| Match filter — Churn/E&U | App.jsx state | Tab render logic | App.jsx owns all tab-level filter state; pre-filters before passing to tab components |
| Match filter — Browse | BrowseTab.jsx state | — | Browse manages its own signal state internally; match filter joins existing sourceFilter/severityFilter/typeFilter pattern |
| Sub-7-day chart guard | SignalVolumeChart.jsx | App.jsx (caller) | Guard can live either in the chart component or at the call site in App.jsx; chart component preferred to keep caller clean |
| Pipeline delay note | PipelineTab.jsx | — | BigStat `sub` prop already exists; change is one string update |

---

## Standard Stack

### Core (already installed — no new dependencies needed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React | current (Vite project) | UI state and rendering | useState already used for all filter state |
| Recharts | 3.x | AreaChart (SignalVolumeChart) | Already imported; no changes to the library |

**No new npm packages are needed for this phase.** All four changes use existing React state patterns and existing inline styles.

---

## Architecture Patterns

### How Filter State Currently Works in App.jsx

App.jsx holds per-tab time filter state:
```javascript
// Existing pattern — Phase 03
const [churnTimeFilter, setChurnTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
const [enrollmentTimeFilter, setEnrollmentTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
```

The match filter follows the identical pattern — one `useState` per tab, simple string value:
```javascript
// Phase 04 addition — same pattern
const [churnMatchFilter, setChurnMatchFilter] = useState('all') // 'all' | 'matched' | 'unmatched'
const [enrollmentMatchFilter, setEnrollmentMatchFilter] = useState('all')
```

Pre-filtering happens in the render body before charts and lists use the data:
```javascript
// Existing — time filter already applied
const tabSignals = filterByTimeFilter(tabSignalsByType, activeTimeFilter)

// Phase 04 addition — match filter applied after time filter
const activeMatchFilter = isChurn ? churnMatchFilter : enrollmentMatchFilter
const displayedTabSignals = tabSignals.filter((s) => {
  if (activeMatchFilter === 'matched') return s.match_method != null && s.match_method !== 'not_found'
  if (activeMatchFilter === 'unmatched') return s.match_method === 'not_found'
  return true // 'all'
})
```

[VERIFIED: src/App.jsx] The existing `matchedSignals` derivation on line 133 already uses the exact same predicate (`match_method != null && match_method !== 'not_found'`). Match filter logic is not new — it only needs a state hook and a UI row.

### How BrowseTab.jsx Filter State Works

BrowseTab has its own parallel filter system, independent of App.jsx:
```javascript
// Existing — sourceFilter, severityFilter, typeFilter, confidenceFilter all follow this pattern
const [sourceFilter, setSourceFilter] = useState(null)

// displayedSignals applies all filters with AND logic
const displayedSignals = signalsForDate.filter((s) => {
  if (sourceFilter && normalizeSource(s.source) !== sourceFilter) return false
  // ... other filters
  return true
})
```

[VERIFIED: src/components/ui/BrowseTab.jsx lines 228-240] The match filter for Browse follows this exact same pattern — add a `matchFilter` state variable and add one more condition to the `displayedSignals` filter function.

### The Match Filter Tab Row UI Pattern

The decision (D-03) says pill-style, consistent with existing patterns. Two patterns exist:

1. **FilterPills.jsx** — complex, has dropdowns, week/month pickers. Too heavy for a 3-option toggle.
2. **Granularity tabs in BrowseTab.jsx** — simple inline button row using `borderBottom` for active state. This pattern is the right model.

[VERIFIED: src/components/ui/BrowseTab.jsx lines 248-271] The granularity tab row is the right reference implementation. The match filter row should use the same inline button approach, but pill-style (rounded corners, border, filled background when active) to match `pillStyle` in FilterPills.jsx.

Recommended approach: render an inline tab row directly above the signal list (no separate component needed). Three buttons: All / Matched / Unmatched. Uses `pillStyle` pattern from FilterPills.jsx.

```javascript
// Match filter tab row — inline, no separate component needed
const matchOptions = [
  { value: 'all', label: 'All' },
  { value: 'matched', label: 'Matched' },
  { value: 'unmatched', label: 'Unmatched' },
]

// Pill style function (same as FilterPills.jsx)
function matchPillStyle(active) {
  return {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
    background: active ? '#0057FF' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#6B7487',
    cursor: 'pointer',
  }
}
```

### How the Sub-7-day Chart Guard Works

[VERIFIED: src/App.jsx lines 49, 92-109 and src/components/charts/SignalVolumeChart.jsx]

The time filter mode is available in App.jsx as `activeTimeFilter.mode`. The check for sub-7-day is:

```javascript
const isSubWeek = activeTimeFilter.mode === 'today' || activeTimeFilter.mode === 'yesterday'
```

The SignalVolumeChart is rendered at App.jsx line 287. The guard can be applied at the call site:

```jsx
{/* Signal Volume */}
<div style={{ marginBottom: 32 }}>
  <SectionHeader title="Signal Volume" subtitle="Signals detected per week" />
  <Panel title="Signals by Week">
    {isSubWeek ? (
      <p style={{ fontSize: 28, fontWeight: 700, color: '#15181D', margin: 0, textAlign: 'center', padding: '24px 0' }}>
        {tabSignals.length}
        <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7487', marginLeft: 8 }}>
          signals {activeTimeFilter.mode === 'today' ? 'today' : 'yesterday'}
        </span>
      </p>
    ) : (
      <SignalVolumeChart signals={tabSignals} onBarClick={handleWeekClick} mode={isChurn ? 'churn' : 'eu'} />
    )}
  </Panel>
</div>
```

Alternatively the guard can live inside `SignalVolumeChart.jsx` by passing the mode as a prop — but since `isSubWeek` is already derivable at the App.jsx call site without touching the chart component, keeping it in App.jsx is simpler and avoids changing the chart component's API.

### How BigStat's sub Prop Works

[VERIFIED: src/components/ui/PipelineTab.jsx lines 16-29]

`BigStat` already accepts a `sub` prop. The Posts Ingested stat card currently reads:
```jsx
<BigStat
  label="Posts Ingested"
  value={totalPosts.toLocaleString()}
  sub="All-time community posts scraped"
/>
```

The fix is to update the `sub` string to include the delay note. D-08 says it should always read "Updated daily through yesterday". Two options:

1. Replace the existing sub text entirely: `sub="Updated daily through yesterday"`
2. Combine: `sub="All-time community posts scraped · Updated daily through yesterday"`

Option 2 preserves the existing context while adding the delay note. Claude's discretion applies here; either is fine.

### How the Browse Scroll Bounds Apply

[VERIFIED: src/components/ui/BrowseTab.jsx lines 322-369 (signals section), 371-423 (posts section)]

Currently the signal rows render directly inside a `<div>` with no height constraint. The fix is to wrap just the rows (not the header row) with a scrolling container:

```jsx
{/* Before: rows rendered directly */}
<div style={tableHeaderRowStyle}>...</div>
{displayedSignals.map((s) => (...))}

{/* After: header stays fixed, rows get the scroll container */}
<div style={tableHeaderRowStyle}>...</div>
<div style={{ maxHeight: 400, overflowY: 'auto' }}>
  {displayedSignals.map((s) => (...))}
</div>
```

Per D-02: the 400px applies to the rows container only, not the panel header ("Signals (42 of 108)") or the filter pills row.

The same pattern applies to the posts section — wrap the posts rows (not the header row) in a `maxHeight: 400, overflowY: 'auto'` container.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Match logic predicate | Custom matching algorithm | `match_method !== 'not_found'` | Already used in MatchRateChart.jsx line 15; identical predicate |
| Pill button styles | New CSS-in-JS abstraction | Copy `pillStyle` from FilterPills.jsx | Already battle-tested in the codebase |
| Sub-7-day detection | Date math | Check `activeTimeFilter.mode === 'today'` | Mode is already a string enum; no date arithmetic needed |

---

## Common Pitfalls

### Pitfall 1: Applying scroll to the wrong container in BrowseTab

**What goes wrong:** Wrapping the entire signals section panel (including the section title and filter pills) in the 400px container — this causes the title and pills to scroll out of view.

**Why it happens:** The decision (D-02) specifically says the 400px applies to the list/table container itself, not the entire panel.

**How to avoid:** The `<div>` that gets `maxHeight: 400, overflowY: 'auto'` is the wrapper around the `.map()` rows only. The header row (`tableHeaderRowStyle`) stays outside it so column labels are always visible.

**Warning signs:** If the column headers ("Org", "Signal Type", etc.) scroll away with the data rows, the container is too high up.

### Pitfall 2: Match filter on Churn/E&U changing the stat cards

**What goes wrong:** If `displayedTabSignals` (match-filtered) replaces `tabSignals` as the source for stat card derivations, the stat cards will reflect the filtered subset, not the full signal set.

**Why it happens:** The match filter is intended only for the signal list, not the charts and stat cards.

**How to avoid:** Keep two separate variables:
- `tabSignals` — time-filtered only. Used by charts, stat cards, and all existing chart-click handlers.
- `displayedTabSignals` — time-filtered AND match-filtered. Used only by the signal list rendered in the tab.

The planner must make this distinction explicit in the task actions.

### Pitfall 3: Browse match filter not resetting on granularity change

**What goes wrong:** User switches from Day to Week in Browse tab, but the match filter stays on "Unmatched" — confusing because they expect filters to reset.

**Why it happens:** The existing filters already reset on granularity change (lines 139-144 in BrowseTab.jsx). If a new `matchFilter` state variable is added but not included in that `useEffect`, it will not reset.

**How to avoid:** Add `setMatchFilter('all')` inside the existing `useEffect` that resets other filters when `granularity` changes.

```javascript
// Existing reset effect — add matchFilter reset here
useEffect(() => {
  setSourceFilter(null)
  setSeverityFilter(null)
  setTypeFilter(null)
  setConfidenceFilter(null)
  setMatchFilter('all') // ADD THIS
}, [granularity])
```

### Pitfall 4: sub prop showing "Updated daily through yesterday" on Pipeline Tab regardless of context

**What goes wrong:** D-08 says the note applies on all time filter selections — this is intentional and correct. The only pitfall is accidentally reading this decision as "only show the note when Today is selected" and adding conditional logic that is not needed.

**How to avoid:** The `sub` string is unconditional. No ternary, no condition.

---

## Code Examples

### Match predicate (already used in codebase)
```javascript
// Source: src/App.jsx line 133 — verified same predicate
const matchedSignals = tabSignals.filter(
  (s) => s.match_method != null && s.match_method !== 'not_found'
)
// Unmatched is the inverse:
const unmatchedSignals = tabSignals.filter(
  (s) => s.match_method === 'not_found'
)
```

### Scroll container wrapper pattern
```javascript
// Source: decision D-01, D-02 — verified against BrowseTab.jsx structure
// Wrap only the rows, not the header
<div style={tableHeaderRowStyle}>
  {/* column labels — stays visible always */}
</div>
<div style={{ maxHeight: 400, overflowY: 'auto' }}>
  {rows.map((row) => (
    <div key={row.id} style={tableRowStyle(true)}>...</div>
  ))}
</div>
```

### BigStat sub prop
```javascript
// Source: src/components/ui/PipelineTab.jsx lines 26-28 — verified
{sub && <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>{sub}</p>}
// D-09 styling already matches what BigStat renders
```

---

## File Change Map

This table maps each decision to the exact file(s) that change. Planner uses this to scope tasks.

| Decision | File | Change Type |
|----------|------|-------------|
| D-01, D-02 — Browse scroll | `src/components/ui/BrowseTab.jsx` | Wrap signals rows and posts rows each in a `maxHeight: 400, overflowY: 'auto'` div |
| D-03, D-04, D-05 — Match filter (Churn/E&U) | `src/App.jsx` | Add 2 useState hooks; add filter application after tabSignals; add filter tab row UI before signal list |
| D-03, D-04, D-05 — Match filter (Browse) | `src/components/ui/BrowseTab.jsx` | Add 1 useState; add to displayedSignals filter; add reset in granularity useEffect; add tab row UI |
| D-06, D-07 — Chart guard | `src/App.jsx` | Add `isSubWeek` boolean; conditional render in Signal Volume section |
| D-08, D-09 — Pipeline note | `src/components/ui/PipelineTab.jsx` | Update `sub` string on Posts Ingested BigStat |

Total files changed: 2 (`App.jsx`, `BrowseTab.jsx`) + 1 (`PipelineTab.jsx`) = 3 files.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Applying the match filter only to the signal list (not stat cards) is the correct behavior | Architecture Patterns, Pitfall 2 | Low risk — CONTEXT.md says the filter is "above the signal list", not "applies to all metrics" |
| A2 | The chart guard living in App.jsx at the call site (not inside SignalVolumeChart.jsx) is the right placement | Architecture Patterns | Very low risk — either location works; call-site guard avoids changing the chart component API |

**All other claims in this research are VERIFIED directly from source files.**

---

## Open Questions

None — all implementation details are fully resolvable from the existing codebase and CONTEXT.md decisions.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely client-side code changes to existing React components with no external dependencies, CLI tools, or services.

---

## Validation Architecture

No automated test infrastructure detected in this project (no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `tests/` directory found). Nyquist validation is not applicable.

**Manual validation checkpoints per task:**
1. Browse scroll: scroll both signals and posts sections in the browser — confirm lists scroll at 400px and headers stay visible.
2. Match filter (Churn/E&U): switch between All / Matched / Unmatched — confirm stat cards do NOT change, only the signal list below changes.
3. Match filter (Browse): apply match filter, then switch granularity tab — confirm filter resets to All.
4. Chart guard: select Today and Yesterday filters on Churn/E&U tabs — confirm chart is replaced by count stat. Select Week/Month/All — confirm chart appears normally.
5. Pipeline note: open Pipeline tab — confirm "Updated daily through yesterday" appears below the Posts Ingested number on all time selections.

---

## Security Domain

All changes are purely client-side UI (CSS, state, conditional rendering). No new API endpoints, no new data access, no user input that reaches the server. Security domain not applicable for this phase.

---

## Sources

### Primary (HIGH confidence — verified from source files)
- `src/App.jsx` — filter state patterns, time filter modes, tabSignals derivation, SignalVolumeChart call site
- `src/components/ui/BrowseTab.jsx` — scroll container structure, displayedSignals filter pattern, granularity reset useEffect
- `src/components/charts/SignalVolumeChart.jsx` — chart component API and data flow
- `src/components/ui/PipelineTab.jsx` — BigStat component and sub prop
- `src/components/ui/FilterPills.jsx` — pillStyle pattern and active/inactive states
- `src/components/ui/BrowseFilterPill.jsx` — dropdown pill pattern (not needed for match filter, but referenced for style consistency)
- `src/utils/dateRanges.js` — filter mode string values ('today', 'yesterday', 'week', 'month', 'all')
- `src/utils/aggregate.js` — groupByWeek, used by SignalVolumeChart
- `.planning/phases/04-browse-ux-data-clarity/04-CONTEXT.md` — all locked decisions

---

## Metadata

**Confidence breakdown:**
- File change map: HIGH — read every affected file directly
- Match filter logic: HIGH — same predicate already in App.jsx line 133
- Scroll bounds implementation: HIGH — container structure verified in BrowseTab.jsx
- Pitfalls: HIGH — derived from actual code structure, not speculation

**Research date:** 2026-05-01
**Valid until:** No expiry — all findings are from the local codebase, not external dependencies
