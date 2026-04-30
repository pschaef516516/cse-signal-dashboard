# Phase 02: Filtering, Drill-downs & Signal Detail - Research

**Researched:** 2026-04-29
**Domain:** React interactivity — state management, Recharts click events, CSS transitions, client-side date filtering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Filter (7d / 30d / 90d / All) lives in the header bar in the same row as tabs — not a separate controls bar
- **D-02:** Filter applies globally to all stat cards AND all charts on the active tab
- **D-03:** Per-tab state — each tab remembers its own filter independently; switching tabs does not reset or sync filters
- **D-04:** Clicking a chart element opens a side panel (drawer) that slides in from the right
- **D-05:** Clickable charts: CommunityChart (by source), SignalVolumeChart (by week), SeverityChart (by severity). NOT clickable: MatchRateChart, ConfidenceHistogram, PostsVsSignalsChart, TopOrgsTable
- **D-06:** Drill-down panel shows signal cards: org name, source, severity, confidence score, match method, created date. Each card is clickable to open detail view.
- **D-07:** Panel closes on click-outside (clicking the dimmed backdrop). No explicit close button required.
- **D-08:** key_quote, summary, and suggested_action exist in Supabase signals table. Add to fetchSignals() select query.
- **D-09:** Detail view expands WITHIN the same drawer (replaces the signal list). Back button returns to list.
- **D-10:** Detail view layout: all metadata at top, then key_quote as highlighted quote block, summary as paragraph, suggested_action as styled callout/action card.
- **D-11:** Navigation: back button only. No prev/next arrow navigation.
- **D-12:** E&U tab gets its own source view split by enrollment and upsell signal type.
- **D-13:** Add enrollment vs upsell split stat cards + stacked chart showing each type's volume trend over time.
- **D-14:** Remove TopOrgsTable from BOTH Churn and Enrollment & Upsell tabs.

### Claude's Discretion

- Exact drawer width and animation style (suggest ~480px, slide from right)
- How to handle "Posts Ingested" stat card under time filtering (posts use `captured_date` not `created_at`)
- Visual treatment of filter pills in the header (active state styling within Compass design tokens)
- How to handle empty states in the drill-down panel

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 02 adds interactivity to a static React dashboard. Everything is already fetched client-side on mount — the time filter is purely a JavaScript `filter()` call over existing state, no new API requests. The drawer is a fixed-position overlay panel wired to `useState` in App.jsx. Recharts provides native `onClick` on `<Bar>` components, passing the clicked data entry as the first argument — this is the primary integration point.

The codebase is simple and consistent: `useState` only (no Redux, no Context), inline styles with Compass tokens, and client-side aggregation in `aggregate.js`. Phase 02 follows these same patterns exactly. There are no third-party UI libraries to install. No new dependencies are needed — Recharts, React, and Vitest are already installed and current.

The most important implementation detail is how `filterByDateRange` integrates with the existing aggregation pipeline. All existing utilities (`groupByWeek`, `countByField`, `getUniqueOrgs`) accept a `rows` array — the filter utility simply returns a sliced `rows` array before passing it to those utilities. The Posts Ingested stat card requires a parallel filter using `captured_date` instead of `created_at`.

**Primary recommendation:** Build in this order — (1) `filterByDateRange` utility + tests, (2) filter pill state in App.jsx + filter application, (3) Recharts onClick handlers, (4) SignalDrawer + SignalCard components, (5) SignalDetail component, (6) E&U tab enrichment (split charts + stat cards + TopOrgsTable removal).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Time period filtering | Browser / Client | — | All data is already fetched; filter is a JS `.filter()` over in-memory state |
| Filter pill UI | Browser / Client | — | Pure React state toggle in App.jsx |
| Recharts click events | Browser / Client | — | Native Recharts `onClick` prop on `<Bar>` — no backend needed |
| Drawer open/close state | Browser / Client | — | `useState` in App.jsx; drawer receives props |
| Signal detail fetch | Browser / Client | — | key_quote/summary/suggested_action already exist in Supabase; just add to select string — no new endpoint |
| E&U split aggregation | Browser / Client | — | New aggregate utilities follow existing pattern; runs on already-fetched signals array |
| Posts date filtering | Browser / Client | — | `captured_date` field in posts array; same filter utility, different field name |

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | Component rendering and useState | Already installed |
| recharts | 3.8.1 | Charts with native onClick events | Already installed; `onClick` on `<Bar>` is built-in |
| vitest | 4.1.5 | Unit tests for aggregate utilities | Already installed and configured |
| @testing-library/react | 16.3.2 | Component tests if needed | Already installed |

[VERIFIED: package.json in repo]

### No New Dependencies Required

All interactivity in Phase 02 is achievable with existing libraries:
- Drawer: plain React + CSS `transform` transition (no animation library needed)
- Filter pills: plain `<button>` elements with inline styles (no component library needed)
- Date filtering: native `Date` constructor (no date library needed)

[VERIFIED: codebase inspection — all patterns confirmed in existing component files]

---

## Architecture Patterns

### System Architecture Diagram

```
App.jsx (state container)
│
├── signals[] (fetched once on mount)
├── posts[] (fetched once on mount, paginated)
├── activeTab: 'churn' | 'enrollment'
├── churnFilter: '7d' | '30d' | '90d' | 'All'    ← NEW
├── enrollmentFilter: '7d' | '30d' | '90d' | 'All' ← NEW
├── drawerOpen: boolean                             ← NEW
├── drawerFilter: { field, value }                  ← NEW
├── drawerSignals: Signal[]                         ← NEW
└── selectedSignal: Signal | null                   ← NEW
│
├── [Header row]
│   ├── Tab buttons (existing)
│   └── FilterPills ──────────────────────────────── reads churnFilter / enrollmentFilter
│                                                    writes churnFilter / enrollmentFilter
│
├── [Tab content]
│   ├── tabSignals = signals filtered by type → then by date (filterByDateRange)
│   ├── StatCards (reads filtered tabSignals + filtered posts)
│   ├── SignalVolumeChart ──── onClick → sets drawerOpen, drawerFilter, drawerSignals
│   ├── CommunityChart ─────── onClick → sets drawerOpen, drawerFilter, drawerSignals
│   ├── SeverityChart ──────── onClick → sets drawerOpen, drawerFilter, drawerSignals
│   └── [E&U tab only]
│       ├── EnrollmentUpsellSplitChart (new)
│       └── EUCommunityChart (new)
│
└── SignalDrawer (rendered at root level, fixed overlay)
    ├── backdrop div ─── onClick → closes drawer
    └── panel div
        ├── [if !selectedSignal] → signal list → SignalCard[] → onClick → setSelectedSignal
        └── [if selectedSignal] → SignalDetail → "Back to signals" → setSelectedSignal(null)
```

### Recommended Project Structure

```
src/
├── api/
│   └── supabase.js          # Add key_quote,summary,suggested_action to fetchSignals()
├── utils/
│   └── aggregate.js         # Add filterByDateRange() and groupBySource() for E&U split
├── components/
│   ├── ui/
│   │   ├── FilterPills.jsx        # NEW — filter pill row component
│   │   ├── SignalDrawer.jsx       # NEW — fixed overlay drawer
│   │   ├── SignalCard.jsx         # NEW — clickable signal card inside drawer
│   │   └── SignalDetail.jsx       # NEW — detail view inside drawer
│   └── charts/
│       ├── SignalVolumeChart.jsx   # MODIFY — add onClick to <Bar>
│       ├── CommunityChart.jsx      # MODIFY — add onClick to <Bar> / <Cell>
│       ├── SeverityChart.jsx       # MODIFY — add onClick to <Bar> / <Cell>
│       ├── TopOrgsTable.jsx        # REMOVE from layouts (keep file or delete)
│       ├── EnrollmentUpsellSplitChart.jsx  # NEW
│       └── EUCommunityChart.jsx           # NEW
└── App.jsx                  # MODIFY — add state, filter logic, drawer wiring
```

### Pattern 1: filterByDateRange utility

**What:** Pure function that takes a rows array and a days number (7, 30, 90, or null for "All"). Returns rows where `created_at` is within the last N days.

**When to use:** Applied to `tabSignals` before passing to any stat card computation or chart component.

```javascript
// Source: [VERIFIED: aggregate.js patterns in codebase — follows existing immutable style]
// Add to src/utils/aggregate.js

export function filterByDateRange(rows, days, dateField = 'created_at') {
  if (!days) return rows  // "All" — no filter
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= cutoff
  })
}
```

**Note:** The `dateField` parameter defaults to `'created_at'` but accepts `'captured_date'` for the Posts Ingested stat card. This handles D-02's special case in a single utility. [ASSUMED: dateField defaulting to created_at — reasonable given codebase pattern, not explicitly specified in CONTEXT.md]

### Pattern 2: Recharts onClick on Bar

**What:** Recharts `<Bar>` accepts an `onClick` prop. The callback receives `(data, index)` where `data` is the chart data entry object (e.g. `{ name: 'Reddit', count: 42 }`).

**When to use:** Add to each of the three clickable charts — CommunityChart, SignalVolumeChart, SeverityChart.

```jsx
// Source: [VERIFIED: Context7 /recharts/recharts — onClick handler documentation]
<Bar
  dataKey="count"
  onClick={(data, index) => onBarClick(data.name)}
  style={{ cursor: 'pointer' }}
>
  {data.map((_, index) => (
    <Cell key={index} fill={COLORS[index % COLORS.length]} />
  ))}
</Bar>
```

For `SignalVolumeChart` (stacked bar by week), the click data entry contains `{ week: '2026-W17', churn: 3, enrollment: 1, upsell: 0 }`. The drill-down filter should use `data.week` to filter signals.

For `SeverityChart`, the data entry is `{ level: 'high', count: 14 }`. Filter by `data.level`.

For `CommunityChart`, the data entry is `{ name: 'Reddit', count: 42 }`. Filter by `data.name` against signal `source`.

[VERIFIED: Context7 /recharts/recharts — confirmed onClick callback signature]

### Pattern 3: Drawer via CSS transform

**What:** Fixed overlay div containing a slide-in panel. Backdrop click closes it. CSS `transform: translateX()` handles the slide animation — do NOT use `display: none` as it breaks the transition.

**When to use:** This is the only drawer implementation — new component `SignalDrawer.jsx`.

```jsx
// Source: [VERIFIED: 02-UI-SPEC.md — exact values specified]
// The drawer is always rendered in the DOM (avoids transition bug)
// but positioned off-screen when closed

function SignalDrawer({ open, title, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: open ? 'auto' : 'none',  // prevent invisible backdrop clicks when closed
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(21, 24, 29, 0.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          background: '#FFFFFF',
          borderLeft: '1px solid #E1E6F2',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

### Pattern 4: Per-tab filter state in App.jsx

**What:** Two independent filter state values, one per tab. Applied when computing `tabSignals`.

**When to use:** This is the primary wiring in App.jsx.

```jsx
// Source: [VERIFIED: CONTEXT.md D-02, D-03 — locked decisions]
const [churnFilter, setChurnFilter] = useState(null)       // null = "All"
const [enrollmentFilter, setEnrollmentFilter] = useState(null)

const activeFilter = activeTab === 'churn' ? churnFilter : enrollmentFilter

// Apply date filter after tab type filter
const tabSignals = filterByDateRange(
  activeTab === 'churn'
    ? signals.filter((s) => s.signal_type === 'churn')
    : signals.filter((s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell'),
  activeFilter
)

// Posts Ingested uses captured_date
const filteredPosts = filterByDateRange(posts, activeFilter, 'captured_date')
```

### Pattern 5: E&U split aggregation

**What:** New aggregate utility that groups signals by source AND signal_type, returning data shaped for a grouped/stacked bar chart.

```javascript
// Source: [VERIFIED: aggregate.js patterns — follows existing immutable reduce pattern]
// Add to src/utils/aggregate.js

export function groupBySourceAndType(rows) {
  const map = {}
  rows.forEach((row) => {
    const source = row.source
    const type = row.signal_type
    if (!source || !type) return
    if (!map[source]) {
      map[source] = { name: source, enrollment: 0, upsell: 0 }
    }
    if (type === 'enrollment' || type === 'upsell') {
      map[source] = { ...map[source], [type]: map[source][type] + 1 }
    }
  })
  return Object.values(map).sort((a, b) => (b.enrollment + b.upsell) - (a.enrollment + a.upsell))
}
```

### Anti-Patterns to Avoid

- **Using `display: none` on the drawer:** Kills CSS transitions. Always use `transform: translateX()` + `opacity`. The drawer stays mounted, just off-screen.
- **Resetting drawer state on tab switch:** Drawer state is independent of active tab. Do not tie `drawerOpen` to `activeTab`.
- **Making a new Supabase fetch when filter changes:** All filtering is client-side over existing state. Never call `fetchSignals()` again for date changes.
- **Passing the full `signals` array to chart onClick handlers:** Pre-filter the `drawerSignals` array in the click handler before passing to the drawer — don't do it inside the drawer component.
- **Mutating state objects:** Follow existing immutable patterns — always spread or return new objects from aggregation functions.
- **Hardcoding filter day values as strings:** Store as `null` (All), `7`, `30`, or `90` as numbers. Parse consistently in `filterByDateRange`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart click events | Custom SVG overlay / mouse position tracking | Recharts native `onClick` on `<Bar>` | Recharts handles the hit testing and passes data directly |
| Slide animation | JavaScript animation loop / `setTimeout` position updates | CSS `transform: translateX()` + `transition` | Smooth GPU-accelerated, no JS overhead |
| Date math | Manual timestamp arithmetic | `new Date()` + `setDate()` (native JS) | Simple enough; no library needed for "subtract N days" |
| Stacked chart for E&U split | Custom SVG | Recharts `<Bar stackId="a">` pattern (already used in SignalVolumeChart) | Identical pattern already exists — copy it |

**Key insight:** This codebase intentionally has no component library, no animation library, and no date library. Every new capability in Phase 02 uses patterns already demonstrated somewhere in the codebase — copy and adapt, don't introduce.

---

## Common Pitfalls

### Pitfall 1: Posts Ingested stat card showing wrong count under time filter

**What goes wrong:** Posts use `captured_date` (a date string like `"2026-03-15"`) not `created_at` (an ISO timestamp). If the filter uses `created_at` against posts rows, it returns 0 or incorrect counts.

**Why it happens:** The `filterByDateRange` utility defaults to `created_at`. Posts data has a different field name.

**How to avoid:** Call `filterByDateRange(posts, activeFilter, 'captured_date')` separately. Create `filteredPosts` alongside `tabSignals` in App.jsx. Pass `filteredPosts.length` to the Posts Ingested stat card.

**Warning signs:** "Posts Ingested" shows 0 when any date filter other than "All" is active.

[VERIFIED: supabase.js — confirmed `captured_date` is the field fetched for posts]

### Pitfall 2: Drawer state not resetting on close

**What goes wrong:** User opens drawer for "Reddit" signals, views a signal detail, closes the drawer, then opens drawer for "High" severity signals — and the detail view is still showing.

**Why it happens:** `selectedSignal` state is not cleared when `drawerOpen` becomes false.

**How to avoid:** In the `onClose` handler for the drawer, reset BOTH `drawerOpen: false` AND `selectedSignal: null`. Document this in a comment near the close handler.

**Warning signs:** Reopening the drawer shows the last viewed detail instead of the signal list.

### Pitfall 3: Invisible backdrop blocking clicks when drawer is closed

**What goes wrong:** Clicking anywhere on the page when the drawer is closed does nothing — interactive elements appear unclickable.

**Why it happens:** The backdrop div has `onClick={onClose}` and covers the entire viewport. If drawer is closed but the backdrop is still `pointer-events: auto`, it intercepts all clicks.

**How to avoid:** Set `pointerEvents: open ? 'auto' : 'none'` on the outermost drawer container div.

**Warning signs:** Chart clicks, tab buttons, or filter pills stop responding when the drawer is in the closed (off-screen) state.

### Pitfall 4: Week-based drill-down filtering mismatches signal dates

**What goes wrong:** Clicking a week bar (e.g. "2026-W17") produces 0 results in the drawer even though signals exist for that week.

**Why it happens:** The `groupByWeek` utility in aggregate.js uses a custom ISO week label function (`getISOWeekLabel`). The drawer filter must use the same function to match signals to the clicked week — not a naive date range comparison.

**How to avoid:** When filtering `drawerSignals` for week-based drill-downs, apply `getISOWeekLabel` to each signal's `created_at` and compare against the clicked `week` value. Export `getISOWeekLabel` from aggregate.js (it is currently unexported — a private helper).

**Warning signs:** Week-based drawer shows empty or incorrect signal lists.

### Pitfall 5: E&U split chart renders on Churn tab

**What goes wrong:** `EnrollmentUpsellSplitChart` and `EUCommunityChart` appear on the Churn tab.

**Why it happens:** Conditional rendering using `isChurn` flag in App.jsx was not applied to the new chart sections.

**How to avoid:** Wrap new E&U chart sections in `{!isChurn && ...}` just like other tab-specific content. Double-check both layout sections after implementation.

---

## Code Examples

Verified patterns from the codebase and official sources:

### filterByDateRange (new utility)

```javascript
// src/utils/aggregate.js — add after existing exports
// [VERIFIED: matches existing immutable pattern in aggregate.js]
export function filterByDateRange(rows, days, dateField = 'created_at') {
  if (!days) return rows
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= cutoff
  })
}
```

### Exporting getISOWeekLabel (needed for drawer week filter)

```javascript
// src/utils/aggregate.js — change from unexported helper to named export
// [VERIFIED: function exists at line 60 in aggregate.js — currently unexported]
export function getISOWeekLabel(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

### fetchSignals with new columns

```javascript
// src/api/supabase.js — add three columns to select string
// [VERIFIED: CONTEXT.md D-08 — columns confirmed to exist in Supabase]
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,signal_type,source,match_method,org_name,confidence,severity,routed_at,key_quote,summary,suggested_action&limit=10000'
  )
}
```

### FilterPills component

```jsx
// src/components/ui/FilterPills.jsx
// [VERIFIED: UI-SPEC.md — exact values specified]
const OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
]

export default function FilterPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {OPTIONS.map(({ label, days }) => {
        const active = value === days
        return (
          <button
            key={label}
            onClick={() => onChange(days)}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
              border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
              background: active ? '#0057FF' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#6B7487',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

### Recharts onClick — CommunityChart modification

```jsx
// src/components/charts/CommunityChart.jsx — add onBarClick prop
// [VERIFIED: Context7 /recharts/recharts]
export default function CommunityChart({ signals, onBarClick }) {
  const data = countByField(signals, 'source')
  // ...
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={data} ...>
        {/* ... */}
        <Bar
          dataKey="count"
          name="Signals"
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
          style={onBarClick ? { cursor: 'pointer' } : undefined}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Drawer state wiring in App.jsx (sketch)

```jsx
// src/App.jsx — new state additions
// [VERIFIED: CONTEXT.md code_context section — confirmed these names]
const [churnFilter, setChurnFilter] = useState(null)
const [enrollmentFilter, setEnrollmentFilter] = useState(null)
const [drawerOpen, setDrawerOpen] = useState(false)
const [drawerTitle, setDrawerTitle] = useState('')
const [drawerSignals, setDrawerSignals] = useState([])
const [selectedSignal, setSelectedSignal] = useState(null)

function openDrawer(title, filteredSignals) {
  setDrawerTitle(title)
  setDrawerSignals(filteredSignals)
  setDrawerOpen(true)
  setSelectedSignal(null)
}

function closeDrawer() {
  setDrawerOpen(false)
  setSelectedSignal(null)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External drawer libraries (react-drawer, etc.) | CSS transform on fixed div | — | No extra dependency; simpler mental model |
| Redux for cross-component state | React useState | — | App is small enough; useState is appropriate |
| recharts < 3.x `onClick` on BarChart level | recharts 3.x `onClick` directly on `<Bar>` | recharts v3 | More precise; data payload is cleaner |

[ASSUMED: recharts v3 onClick behavior described above is based on training data and Context7 docs — behavior confirmed via Context7 but exact payload shape should be verified during implementation]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `filterByDateRange` accepting `dateField` as third parameter cleanly handles the posts `captured_date` edge case | Pattern 1 | Posts Ingested stat card shows wrong count — needs a separate utility call instead |
| A2 | Storing filter as `null` (All) vs number (7, 30, 90) is the right data type — not a string | Pattern 4 | Type comparison bug in `filterByDateRange` — easy fix but must be consistent |
| A3 | `getISOWeekLabel` export does not require any changes to the existing tests | Pitfall 4 | Tests break if something in the export changes the function identity — unlikely |
| A4 | Recharts 3.8.1 `onClick` on `<Bar>` passes `(entry, index)` where `entry` matches the data array object shape | Pattern 2 | Click handler receives wrong shape — verify in dev with console.log during implementation |

---

## Open Questions

1. **Does `captured_date` in the posts table contain date strings or ISO timestamps?**
   - What we know: `fetchPosts()` selects `captured_date,source` — format not verified beyond field name
   - What's unclear: If it's a date-only string (`"2026-03-15"`) vs a full ISO timestamp, `new Date()` parsing behavior differs slightly across browsers
   - Recommendation: `console.log(posts[0].captured_date)` in development to verify format before shipping the filter

2. **Does TopOrgsTable.jsx file get deleted or just removed from layouts?**
   - What we know: D-14 says remove from both tab layouts; the file still exists
   - What's unclear: Whether to delete the file or just stop importing it
   - Recommendation: Remove from layouts only, leave the file. Deleting it is irreversible and Phase 03 may not need it, but leaving it costs nothing.

3. **How many signals does a typical week bar or source bar contain?**
   - What we know: Total signals in Supabase unknown from this research
   - What's unclear: Whether the drawer signal list needs pagination or virtual scrolling
   - Recommendation: Implement without pagination first; if a single click returns more than ~50 signals, add a "showing top 50" cap as a follow-up.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server | Yes | (darwin, runs vite) | — |
| Vite | Dev/build | Yes | 8.0.10 | — |
| Recharts | Charts + onClick | Yes | 3.8.1 | — |
| Vitest | Unit tests | Yes | 4.1.5 | — |
| Supabase REST API | Signal data | Yes (live) | PostgREST | — |

[VERIFIED: package.json — all versions confirmed]

No missing dependencies. No install steps needed for this phase.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | vite.config.js (inline `test` block) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

[VERIFIED: vite.config.js and package.json scripts]

### Phase Requirements to Test Map

| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| D-02/D-03 | `filterByDateRange` returns rows within N days | unit | `npm test` | Wave 0 gap |
| D-02/D-03 | `filterByDateRange` with `captured_date` field | unit | `npm test` | Wave 0 gap |
| D-02/D-03 | `filterByDateRange(rows, null)` returns all rows | unit | `npm test` | Wave 0 gap |
| D-12 | `groupBySourceAndType` splits by enrollment/upsell | unit | `npm test` | Wave 0 gap |
| D-08 | `fetchSignals` select string includes new columns | manual (inspect network) | — | manual-only |
| Pitfall 4 | `getISOWeekLabel` export produces correct week label | unit | `npm test` | Wave 0 gap |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/utils/aggregate.test.js` — add `filterByDateRange` and `groupBySourceAndType` and `getISOWeekLabel` test cases to existing file (file exists, needs new `describe` blocks)

*(All existing tests remain — new describe blocks are appended only)*

---

## Security Domain

This phase has no authentication, no user input stored to a database, no new API endpoints, and no secrets beyond the existing Supabase anon key in `.env.local`. The anon key constraint (never use service_role in frontend) is enforced already in `supabase.js` and is unchanged by this phase.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Anon read-only Supabase — no write operations |
| V5 Input Validation | No | No user text input — all inputs are button clicks |
| V6 Cryptography | No | No cryptographic operations |

**No new security concerns introduced by Phase 02.** Filter pills and chart clicks produce integer/string values consumed client-side only — never sent to a server as query parameters.

---

## Sources

### Primary (HIGH confidence)
- Codebase — `src/api/supabase.js`, `src/utils/aggregate.js`, `src/App.jsx`, all chart components — direct file reads
- `02-CONTEXT.md` — locked decisions and code context
- `02-UI-SPEC.md` — exact component dimensions, colors, typography, interaction contract
- `package.json` — verified all library versions
- `vite.config.js` — verified test configuration
- Context7 `/recharts/recharts` — `onClick` on `<Bar>` callback signature and stacked bar pattern

### Secondary (MEDIUM confidence)
- `PROJECT.md` — project constraints and key decisions
- `STATE.md` and `ROADMAP.md` — phase scope and dependencies

### Tertiary (LOW confidence — not used)

None. All claims in this research are verified against codebase files or Context7 documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via package.json
- Architecture: HIGH — all patterns directly observed in existing codebase; no new paradigms
- Recharts onClick: HIGH — verified via Context7 /recharts/recharts
- Pitfalls: HIGH — derived from actual code inspection (e.g., captured_date field name, unexported getISOWeekLabel, drawer pointer-events)
- E&U split aggregation: HIGH — pattern mirrors existing aggregate.js utilities exactly

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (Recharts and React are stable; no fast-moving APIs here)
