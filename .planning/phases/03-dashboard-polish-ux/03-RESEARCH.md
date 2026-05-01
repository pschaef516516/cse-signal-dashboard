# Phase 03: Dashboard Polish & UX - Research

**Researched:** 2026-04-30
**Domain:** React UX patterns, Recharts 3.x, vanilla JS date math, modal/dropdown implementation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Signal Navigator Modal**
- D-01: Clicking a signal anywhere opens a centered modal (~700px) going directly to signal detail — no intermediate list step.
- D-02: Prev/Next arrows at top with "3 of 12 signals" counter. Navigates through the full signal list for current context.
- D-03: Modal closes via backdrop click, X button, or Escape key.
- D-04: Browse tab Prev/Next navigates through all signals for selected date/period.
- D-05: Replaces SignalDrawer everywhere. New component: SignalModal.jsx.

**Browse Tab Redesign**
- D-06: Replace date picker with Day | Week | Month | All Time tabs. Day retains existing date picker.
- D-07: Filters apply to signals section only.
- D-08: Filter pills above signals table, each opens a dropdown. Active filters render as filled/colored pills.
- D-09: All Time tab loads all signals and posts without date constraint.

**Time Filter Redesign (Churn + E&U tabs)**
- D-10: Replace 7d/30d/90d/All with: Today | Yesterday | Week ↓ | Month ↓ | All. Week and Month open dropdown pickers.
- D-11: "Last Week" = previous full calendar week (Mon–Sun). "Last Month" = previous full calendar month. Calendar-anchored, not rolling.

**Pipeline Tab**
- D-12: Tab order: Churn / Enrollment & Upsell / Browse / Pipeline.
- D-13: Pipeline tab content: Posts vs Signals chart, signal rate % trend, posts by community source, pipeline volume over time.
- D-14: Pipeline tab does not use time filter pills — all-time by default.

**Category & Status Breakdowns**
- D-15: Each tab gets "Signal Categories" section. Churn shows churn categories, E&U shows enrollment categories.
- D-16: Category chart click opens Signal Navigator Modal filtered to that category.
- D-17: Active/Churned status badge inline next to org name. Green = Active, Red = Churned.
- D-18: % Preventable Churn stat card on Churn tab using `preventability` column.

### Claude's Discretion
- Exact animation/transition style for modal (fade in, scale up, or slide)
- Week/Month dropdown picker implementation details (native select or custom)
- Filter pill dropdown positioning and animation
- Whether Pipeline tab has its own time controls or is always all-time
- Category chart type (horizontal bar, donut, or vertical bar)
- Badge styling details (font size, pill padding, exact shade of green/red within Compass tokens)

### Deferred Ideas (OUT OF SCOPE)
- Claude AI chat integration — Phase 04
- Org-centric signal history page — future phase
- Daily Slack/email digest — future phase
- "Mark Actioned" write-back to Supabase — future phase
- Export to CSV — future phase
- Keyboard navigation (arrow keys in modal list) — future phase
- Source filter on posts section of Browse — pending data quality verification
</user_constraints>

---

## Summary

Phase 03 is a pure UX polish phase — no new data sources, no backend changes, no external libraries. Every pattern needed here already has a proven precedent in the existing codebase: the drawer open/close pattern extends naturally to a modal, the chart onClick handlers are already wired and work, and the date math can be done with the same vanilla JS Date techniques used in BrowseTab.jsx today.

The five capability areas divide cleanly into two difficulty tiers. The modal + time filter redesign are straightforward pattern lifts from what already exists. The browse filter pills and category chart are moderate additions. The Pipeline tab is a composition exercise reusing PostsVsSignalsChart and CommunityChart components that were already built in prior phases.

The biggest implementation risk is the "click-outside" detection for filter pill dropdowns — getting the event listener cleanup wrong causes memory leaks or the dropdown never closing. The second biggest risk is z-index stacking for the modal backdrop, which requires the backdrop to live at the root level (App.jsx renders it) to avoid being clipped by parent stacking contexts.

**Primary recommendation:** Build in this order: (1) SignalModal.jsx replaces SignalDrawer, (2) Time filter redesign in App.jsx, (3) Category charts + status badge, (4) Browse filter pills, (5) Pipeline tab. Each step is independently testable.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Signal Navigator Modal | Frontend (component) | App.jsx state | Modal is UI only — signal data already in memory from initial fetch |
| Modal Prev/Next navigation | App.jsx state | SignalModal.jsx | The list being navigated lives in App.jsx (passed as prop) |
| Browse filter pills | BrowseTab.jsx state | — | Self-contained per CONTEXT.md code_context — filter state lives inside BrowseTab |
| Time filter redesign | App.jsx state | FilterPills replacement | Same location as current churnFilter/enrollmentFilter state |
| Calendar date math | utils/aggregate.js | — | Stateless utility functions, no React dependency |
| Category breakdown chart | App.jsx (data prep) | New chart component | countByField already does this — just needs a new chart component |
| Status badge | SignalCard.jsx | — | Inline display logic, signal data already available on the card |
| % Preventable Churn stat | App.jsx (derivation) | StatCard.jsx | Same pattern as existing matchRate / highSeverity derivations |
| Pipeline tab | New PipelineTab.jsx | App.jsx TABS array | Standalone component, composition of existing chart components |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| React | 19.2.5 | UI rendering, useState, useEffect, useRef | Already in project |
| Recharts | 3.8.1 | All charts | Already in project, locked decision |

### No New Libraries Needed

All Phase 03 capabilities are implementable with React built-ins + the existing codebase:
- Modal: `useState` + `useEffect` for keyboard listener + inline styles
- Dropdown detection: `useRef` + `useEffect` mousedown listener
- Date math: vanilla JS `Date` object
- Filter pills: `useState` for open/close + per-pill filter state

**Version verification:** [VERIFIED: package.json] — `react@^19.2.5`, `recharts@^3.8.1`

---

## Architecture Patterns

### System Architecture Diagram

```
App.jsx
├── TABS array (now 4: Churn / E&U / Browse / Pipeline)
│
├── Modal state: { open, signals[], currentIndex }
│     └── openModal(signals, startIndex)  ← called by any chart click or signal row click
│
├── Time filter state (replaces churnFilter/enrollmentFilter)
│     ├── { type: 'today' | 'yesterday' | 'week' | 'month' | 'all' }
│     └── { weekValue: 'YYYY-WXX' | null, monthValue: 'YYYY-MM' | null }
│
├── Churn tab
│     ├── StatCards (including new % Preventable Churn)
│     ├── Existing charts (SignalVolume, Community, Match, Confidence, Severity)
│     └── NEW: CategoryBreakdownChart → openModal(filtered signals)
│
├── E&U tab
│     ├── StatCards
│     ├── Existing charts
│     └── NEW: CategoryBreakdownChart → openModal(filtered signals)
│
├── Browse tab (BrowseTab.jsx — self-contained)
│     ├── Granularity tabs: Day | Week | Month | All Time
│     ├── NEW: FilterPills row (source, severity, signal type, confidence)
│     │     └── Each pill → dropdown → filter state inside BrowseTab
│     └── Signals table rows → onSignalClick(signal) → App.jsx openModal
│
├── Pipeline tab (new PipelineTab.jsx)
│     ├── PostsVsSignalsChart (restored)
│     ├── Signal rate % trend
│     └── Posts by source breakdown
│
└── SignalModal.jsx (replaces SignalDrawer)
      ├── Backdrop (z-index: 1000, covers full viewport)
      ├── Centered card (700px, z-index: 1001)
      ├── Header: "← 3 of 12 signals  →   [X]"
      └── Body: <SignalDetail signal={signals[currentIndex]} />
```

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── ui/
│   │   ├── SignalModal.jsx        # NEW — replaces SignalDrawer
│   │   ├── FilterPills.jsx        # REPLACE — calendar-anchored time filter
│   │   ├── BrowseFilterPills.jsx  # NEW — source/severity/type/confidence pills for Browse
│   │   └── SignalCard.jsx         # MODIFY — add status badge
│   └── charts/
│       └── CategoryBreakdownChart.jsx  # NEW — horizontal bar, clickable
├── utils/
│   ├── aggregate.js               # ADD groupByCategory()
│   └── dateRanges.js              # NEW — calendar-anchored date math utilities
```

---

## Pattern 1: Modal with Keyboard + Backdrop Close

**What:** A centered overlay modal that closes on Escape key, backdrop click, or X button — no external library.

**When to use:** D-01 through D-05 — the new SignalModal replacing SignalDrawer.

**Key insight:** The `useEffect` keyboard listener must be added and removed on every open/close cycle. Adding it once at mount and leaving it attached causes it to fire even when the modal is closed.

**The z-index rule:** The backdrop `div` must render as a direct child of App.jsx's root `div`, NOT inside any Panel or other container that has `position: relative` or its own z-index. This prevents stacking context clipping. [VERIFIED: web search + MDN stacking context docs]

```jsx
// Source: verified pattern from React community + codebase conventions
// SignalModal.jsx
import { useEffect } from 'react'
import SignalDetail from './SignalDetail'

export default function SignalModal({ open, signals, currentIndex, onClose, onPrev, onNext }) {
  // Add Escape key listener only while modal is open
  useEffect(() => {
    if (!open) return  // do nothing if closed

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onPrev()
      if (e.key === 'ArrowRight' && currentIndex < signals.length - 1) onNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)  // CRITICAL cleanup
  }, [open, currentIndex, signals.length, onClose, onPrev, onNext])

  if (!open || !signals || signals.length === 0) return null

  const signal = signals[currentIndex]
  const total = signals.length
  const position = currentIndex + 1  // 1-based display

  return (
    <>
      {/* Backdrop — catches outside clicks */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,              // top:0 right:0 bottom:0 left:0 shorthand
          background: 'rgba(21, 24, 29, 0.5)',
          zIndex: 1000,
        }}
      />

      {/* Modal card — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          background: '#FFFFFF',
          border: '1px solid #E1E6F2',
          borderRadius: 16,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal header with Prev/Next + counter + close */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E1E6F2',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              aria-label="Previous signal"
              style={{
                background: 'none',
                border: '1px solid #E1E6F2',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                color: currentIndex === 0 ? '#E1E6F2' : '#15181D',
                fontSize: 16,
              }}
            >
              ←
            </button>
            <span style={{ fontSize: 13, color: '#6B7487', fontWeight: 500 }}>
              {position} of {total} signals
            </span>
            <button
              onClick={onNext}
              disabled={currentIndex === signals.length - 1}
              aria-label="Next signal"
              style={{
                background: 'none',
                border: '1px solid #E1E6F2',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: currentIndex === signals.length - 1 ? 'not-allowed' : 'pointer',
                color: currentIndex === signals.length - 1 ? '#E1E6F2' : '#15181D',
                fontSize: 16,
              }}
            >
              →
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#6B7487',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <SignalDetail
            signal={signal}
            onBack={null}  // no "back" needed — modal replaces the list-then-detail flow
          />
        </div>
      </div>
    </>
  )
}
```

**State pattern in App.jsx** (replaces drawerOpen/drawerSignals/drawerTitle/selectedSignal):

```jsx
// Replace 4 state vars with 3 cleaner ones
const [modalOpen, setModalOpen] = useState(false)
const [modalSignals, setModalSignals] = useState([])
const [modalIndex, setModalIndex] = useState(0)

function openModal(signals, startIndex = 0) {
  setModalSignals(signals)
  setModalIndex(startIndex)
  setModalOpen(true)
}

function closeModal() {
  setModalOpen(false)
}

// All chart click handlers now call openModal instead of openDrawer
function handleCommunityClick(sourceName) {
  const filtered = tabSignals.filter((s) => s.source === sourceName)
  openModal(filtered, 0)
}
```

**SignalDetail modification:** Remove the `onBack` button rendering when `onBack` is null. Add a guard:

```jsx
// In SignalDetail.jsx — wrap the back button
{onBack && (
  <button onClick={onBack} ...>← Back to signals</button>
)}
```

---

## Pattern 2: Calendar-Anchored Date Math (vanilla JS)

**What:** Functions to compute Today, Yesterday, This Week (Mon–Sun), Last Week, This Month, Last Month boundaries without any date library.

**When to use:** D-10, D-11 — the new time filter replacing rolling 7d/30d/90d pills.

**The DST trap:** When computing "start of day" boundaries, always use `setHours(0,0,0,0)` on a cloned Date, not on the original. `new Date(someDate)` creates a shallow copy. Never use UTC methods for local calendar display. [ASSUMED — standard JS behavior, but worth noting]

**Week anchor:** ISO weeks start Monday. JS `.getDay()` returns 0 for Sunday. Use `(d.getDay() + 6) % 7` to get Monday-anchored day index (Mon=0, Sun=6).

```javascript
// Source: aggregate.js pattern extended — place in src/utils/dateRanges.js

// Returns { start: Date, end: Date } where end is exclusive (< end, not <=)
// All boundaries are local-time midnight.

export function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getYesterdayRange() {
  const start = new Date()
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// isoWeek: "YYYY-WXX" string (same format as getISOWeekLabel in aggregate.js)
export function getWeekRange(isoWeek) {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - dayOfWeek + 1)
  const start = new Date(week1Mon)
  start.setDate(week1Mon.getDate() + (week - 1) * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// yearMonth: "YYYY-MM" string
export function getMonthRange(yearMonth) {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1  // JS months are 0-based
  const start = new Date(year, month, 1)
  start.setHours(0, 0, 0, 0)
  // First day of next month minus 1ms = last ms of this month
  const end = new Date(year, month + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// Helper: apply a { start, end } range to filter an array of rows
// dateField defaults to 'created_at', same convention as aggregate.js
export function filterByRange(rows, range, dateField = 'created_at') {
  if (!range) return rows
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= range.start && d <= range.end
  })
}

// Build a list of ISO week options for a dropdown — last N weeks ending yesterday
export function getRecentWeeks(count = 12) {
  const weeks = []
  const seen = new Set()
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - 1)  // start from yesterday
  for (let i = 0; i < count * 7 && weeks.length < count; i++) {
    // Import getISOWeekLabel from aggregate.js — same function
    const label = getISOWeekLabelLocal(cursor)
    if (!seen.has(label)) {
      seen.add(label)
      weeks.push(label)
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return weeks  // most recent first
}

// Build a list of "YYYY-MM" month options — last N months
export function getRecentMonths(count = 12) {
  const months = []
  const cursor = new Date()
  cursor.setDate(1)  // avoid month-end edge cases
  for (let i = 0; i < count; i++) {
    const yyyy = cursor.getFullYear()
    const mm = String(cursor.getMonth() + 1).padStart(2, '0')
    months.push(`${yyyy}-${mm}`)
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return months  // most recent first
}

// Internal copy — avoids circular import with aggregate.js
function getISOWeekLabelLocal(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

**New FilterPills.jsx state shape** (replaces the simple `days` number):

```jsx
// time filter value shape:
// { mode: 'today' | 'yesterday' | 'week' | 'month' | 'all', weekValue: null | 'YYYY-WXX', monthValue: null | 'YYYY-MM' }
// null weekValue/monthValue means "picker not yet opened" — treat as current week/month

// In App.jsx — replace churnFilter/enrollmentFilter (numbers) with:
const [churnTimeFilter, setChurnTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
const [enrollmentTimeFilter, setEnrollmentTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
```

---

## Pattern 3: Dropdown Filter Pills (click-outside detection)

**What:** A pill button that toggles a positioned dropdown below it. Closes on outside click or when another pill opens.

**When to use:** D-08 (Browse filter pills: source, severity, type, confidence), D-10 (Week/Month picker dropdowns in time filter).

**The critical useEffect pattern:** The mousedown listener must be attached to `document` (not `window`). Check `!ref.current.contains(e.target)` before closing. Clean up on every re-render when `isOpen` changes. [VERIFIED: React community standard pattern]

**Positioning gotcha:** `position: absolute` on the dropdown is relative to the nearest `position: relative` ancestor. Wrap the pill + dropdown in a `position: relative` div so the dropdown anchors correctly. Do NOT use `position: fixed` for these dropdowns (only for the modal backdrop).

```jsx
// Source: verified React useRef + useEffect click-outside pattern
// BrowseFilterPill.jsx — one pill with its own dropdown
import { useEffect, useRef, useState } from 'react'

export default function BrowseFilterPill({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen])

  const active = value !== null  // something is selected

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 20,
          border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
          background: active ? '#0057FF' : '#FFFFFF',
          color: active ? '#FFFFFF' : '#6B7487',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {label}{value ? `: ${value}` : ''} {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          background: '#FFFFFF',
          border: '1px solid #E1E6F2',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          zIndex: 100,
          minWidth: 160,
          overflow: 'hidden',
        }}>
          {/* Clear option */}
          <button
            onClick={() => { onChange(null); setIsOpen(false) }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 14px',
              fontSize: 13,
              color: '#6B7487',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: '1px solid #E1E6F2',
            }}
          >
            All (clear)
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                fontSize: 13,
                color: value === opt ? '#0057FF' : '#15181D',
                fontWeight: value === opt ? 600 : 400,
                background: value === opt ? '#F0F5FF' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Browse filter state in BrowseTab.jsx:**

```jsx
const [sourceFilter, setSourceFilter] = useState(null)
const [severityFilter, setSeverityFilter] = useState(null)
const [typeFilter, setTypeFilter] = useState(null)
const [confidenceFilter, setConfidenceFilter] = useState(null)

// Derive filter options from loaded signals
const sourceOptions = [...new Set(signalsForDate.map((s) => normalizeSource(s.source)).filter(Boolean))]
const severityOptions = ['low', 'medium', 'high']
const typeOptions = ['churn', 'enrollment']
const confidenceOptions = ['0.0–0.3', '0.3–0.6', '0.6–0.8', '0.8–1.0']  // bucket display

// Apply filters to displayed signals
const displayedSignals = signalsForDate.filter((s) => {
  if (sourceFilter && normalizeSource(s.source) !== sourceFilter) return false
  if (severityFilter && s.severity !== severityFilter) return false
  if (typeFilter && s.signal_type !== typeFilter) return false
  if (confidenceFilter) {
    const conf = parseFloat(s.confidence)
    // map confidenceFilter label back to numeric range
    const [lo, hi] = confidenceFilter.split('–').map(Number)
    if (isNaN(conf) || conf < lo || conf > hi) return false
  }
  return true
})
```

---

## Pattern 4: Recharts Bar onClick for Category Drill-Down

**What:** Clickable horizontal bar chart that passes the clicked category name to a parent handler, which opens the modal filtered to that category.

**When to use:** D-15, D-16 — CategoryBreakdownChart on Churn and E&U tabs.

**The onClick signature:** Recharts Bar `onClick` receives `(entry, index, event)`. The `entry` is the data object for that bar — access `entry.name` (or whatever your dataKey is) to get the category. This is already the established pattern in CommunityChart.jsx and SeverityChart.jsx. [VERIFIED: codebase + Context7]

**Truncating long category names:** Category values like `churn_price_complaint` need to be shortened for display. Use a `tickFormatter` on the YAxis or a `formatCategory` helper. Do NOT truncate with CSS overflow in Recharts — the SVG text renders outside normal CSS flow.

```jsx
// Source: verified from CommunityChart.jsx pattern + Context7 Recharts docs
// CategoryBreakdownChart.jsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { countByField } from '../../utils/aggregate'

// Make snake_case category keys human-readable
function formatCategory(key) {
  if (!key) return 'Unknown'
  return key
    .replace(/^churn_|^enrollment_/, '')   // strip signal type prefix
    .replace(/_/g, ' ')                    // underscores to spaces
    .replace(/\b\w/g, (c) => c.toUpperCase())  // title case
}

const COLORS = ['#0057FF', '#3378FF', '#6699FF', '#99BBFF', '#B2CDFF']

export default function CategoryBreakdownChart({ signals, onBarClick }) {
  const data = countByField(signals, 'category')
    .filter((d) => d.name != null)
    .slice(0, 10)  // cap at 10 categories to keep chart readable

  if (data.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No category data.</p>
  }

  // Chart height scales with number of categories: 40px per bar + padding
  const chartHeight = Math.max(200, data.length * 40 + 40)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fontSize: 11 }}
          tickFormatter={formatCategory}
        />
        <Tooltip formatter={(value) => [value, 'Signals']} labelFormatter={formatCategory} />
        <Bar
          dataKey="count"
          name="Signals"
          maxBarSize={28}
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
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

**In App.jsx** — category click handler (same pattern as handleCommunityClick):

```jsx
function handleCategoryClick(category) {
  const filtered = tabSignals.filter((s) => s.category === category)
  openModal(filtered, 0)
}
```

**groupByCategory utility in aggregate.js:**

```javascript
// Thin wrapper — countByField already does this generically
// Just use: countByField(signals, 'category')
// No new utility needed — use existing countByField
```

---

## Pattern 5: Active/Churned Status Badge

**What:** Small colored pill displayed next to org name on SignalCard.

**When to use:** D-17 — signal `status` or `customer_status` columns, fallback to `churn_date`.

**Field priority logic:** Check `status` first, then `customer_status`, then infer from `churn_date`. [VERIFIED: signals schema in .claude/projects/memory]

```jsx
// In SignalCard.jsx — add alongside the org name line

function StatusBadge({ signal }) {
  // Determine status: direct fields first, then churn_date fallback
  const raw = signal.status || signal.customer_status || null
  const isChurned =
    raw?.toLowerCase().includes('churn') ||
    (!raw && Boolean(signal.churn_date))
  const isActive =
    raw?.toLowerCase() === 'active' ||
    (!raw && !signal.churn_date)

  if (!isChurned && !isActive) return null  // unknown — don't show badge

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: isChurned ? '#FDE8EF' : '#E6F7EE',
      color: isChurned ? '#D81860' : '#00A344',
      marginLeft: 6,
      verticalAlign: 'middle',
    }}>
      {isChurned ? 'Churned' : 'Active'}
    </span>
  )
}

// In SignalCard render — modify the org name line:
<p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0 }}>
  {signal.org_name || 'Unknown'}
  <StatusBadge signal={signal} />
</p>
```

---

## Pattern 6: % Preventable Churn Stat Card

**What:** A new stat card on the Churn tab showing what % of churn signals have `preventability = 'high'`.

**When to use:** D-18.

**Derivation — add alongside existing stat card calculations in App.jsx:**

```jsx
// In App.jsx — alongside highSeverity, matchRate derivations
const preventableCount = tabSignals.filter((s) => s.preventability === 'high').length
const preventablePct = tabSignals.length > 0
  ? Math.round((preventableCount / tabSignals.length) * 100)
  : 0
```

```jsx
// In JSX — add to the stat cards grid on the Churn tab
{isChurn && (
  <StatCard
    title="% Preventable Churn"
    value={`${preventablePct}%`}
    subtitle={`${preventableCount} of ${tabSignals.length} signals`}
  />
)}
```

---

## Pattern 7: Pipeline Tab

**What:** A new standalone tab component showing pipeline health metrics.

**When to use:** D-12, D-13, D-14.

**Recommended chart composition** (reusing existing components and data already fetched in App.jsx):
- **Posts vs Signals over time:** `PostsVsSignalsChart` — already exists, was removed from Churn tab. Pass `signals` (all types) and `posts` props.
- **Signal rate % by week:** Derived from groupByWeek output — `signals / (signals + posts)` per week. Use a `LineChart` with a single line. Format Y axis as percent.
- **Posts by source breakdown:** `CommunityChart` variant — pass all `posts`, group by `source`. This uses `countByField(posts, 'source')`.

**Pipeline tab does NOT use time filter** per D-14 — it receives raw `signals` and `posts` from App.jsx.

```jsx
// PipelineTab.jsx — shell structure
export default function PipelineTab({ signals, posts }) {
  // Compute signal rate by week from weekly grouped data
  const weeklyData = groupByWeek(signals).map((row) => {
    const signalCount = row.churn + row.enrollment + row.upsell
    const postCount = posts.filter((p) => {
      const d = new Date(p.captured_date)
      return getISOWeekLabel(d) === row.week
    }).length
    const rate = (signalCount + postCount) > 0
      ? Math.round((signalCount / (signalCount + postCount)) * 100)
      : 0
    return { week: formatWeekLabel(row.week), signalCount, postCount, rate }
  })

  return (
    <div>
      {/* Posts vs Signals */}
      <Panel title="Posts Ingested vs Signals Generated">
        <PostsVsSignalsChart signals={signals} posts={posts} />
      </Panel>

      {/* Signal conversion rate over time */}
      <Panel title="Signal Conversion Rate (%) by Week">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData} ...>
            <Line dataKey="rate" stroke="#0057FF" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Posts by source */}
      <Panel title="Posts Ingested by Source">
        <CommunityChart signals={posts} onBarClick={undefined} />
        {/* CommunityChart uses countByField(normalized, 'source') — passes with posts too */}
      </Panel>
    </div>
  )
}
```

**Note:** `CommunityChart` uses `normalizeSource` and `countByField` on the `source` field — it works for posts too since posts have the same `source` column. Pass `posts` as the `signals` prop and do not pass `onBarClick` (Pipeline tab has no drill-down per D-14).

---

## Pattern 8: Browse Tab Time Granularity Tabs (Day/Week/Month/All Time)

**What:** Replace the single date picker in BrowseTab.jsx with 4 tabs that control fetch behavior.

**State inside BrowseTab.jsx** (self-contained per CONTEXT.md):

```jsx
const [granularity, setGranularity] = useState('day')  // 'day' | 'week' | 'month' | 'all'
const [selectedDate, setSelectedDate] = useState(yesterdayString())
const [selectedWeek, setSelectedWeek] = useState(null)   // 'YYYY-WXX' or null
const [selectedMonth, setSelectedMonth] = useState(null)  // 'YYYY-MM' or null
```

**Fetch trigger logic:** The useEffect depends on `[granularity, selectedDate, selectedWeek, selectedMonth]`. For "all", call the existing `fetchSignals()` / `fetchPosts()` (which already fetches everything).

**Mapping granularity to Supabase queries:**
- `day`: existing `fetchSignalsByDate(selectedDate)` / `fetchPostsByDate(selectedDate)` — no change
- `week`: need `fetchSignalsByRange(start, end)` — new function that uses `gte`/`lte` on `created_at`
- `month`: same `fetchSignalsByRange(start, end)` with month boundaries
- `all`: `fetchSignals()` + `fetchPosts()` (already paginated)

**New Supabase helper needed in api/supabase.js:**

```javascript
// Date range fetch — used for week and month granularity in Browse tab
export async function fetchSignalsByRange(startISO, endISO) {
  return fetchSupabase(
    `signals?select=...&created_at=gte.${startISO}&created_at=lte.${endISO}&limit=10000`
  )
}

export async function fetchPostsByRange(startDate, endDate) {
  // Posts use captured_date (date-only column)
  return fetchSupabase(
    `posts?select=...&captured_date=gte.${startDate}&captured_date=lte.${endDate}&limit=10000`
  )
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Modal close on Escape | Custom keyboard manager | `useEffect` with `document.addEventListener('keydown', ...)` + cleanup | 3 lines vs a whole module |
| Dropdown click-outside | Complex event delegation system | `useRef` + `document.addEventListener('mousedown', ...)` in `useEffect` | Already the community standard pattern |
| Date library | Importing date-fns or moment | Vanilla JS `Date` + the helpers in `dateRanges.js` above | Project constraint, and the math is straightforward |
| Focus trap in modal | Custom focus management | Not needed for this dashboard — CSMs are mouse-first users | Focus trap adds complexity for minimal accessibility gain on internal tools |
| Portal for modal | `ReactDOM.createPortal` | Render the modal as last child inside App.jsx's root div | Project already avoids complexity — a high enough z-index on `position: fixed` works fine for a single-level modal |

**Key insight:** The existing CommunityChart, SeverityChart patterns are the model for every new interactive chart. Copy the `onClick={(entry) => onBarClick(entry.name)}` pattern exactly.

---

## Common Pitfalls

### Pitfall 1: Missing useEffect cleanup on keyboard/mousedown listeners

**What goes wrong:** Adding `document.addEventListener` in `useEffect` without returning a cleanup function. The listener accumulates on every render cycle. On the Escape key listener, this means pressing Escape triggers `onClose` multiple times (or after the modal is already closed).

**Why it happens:** `useEffect` with dependencies re-runs when deps change. If you add a listener but never remove it, you stack up N copies.

**How to avoid:** Always return `() => document.removeEventListener(...)` from useEffect. Pattern above shows this explicitly.

**Warning signs:** Modal closes twice on one Escape keypress, or console shows multiple identical handler calls.

---

### Pitfall 2: z-index clipping by parent stacking context

**What goes wrong:** The modal backdrop (z-index: 1000) is invisible or appears behind chart panels, even though the z-index number is high.

**Why it happens:** A parent element with `position: relative` + any `z-index` value creates a new stacking context. Any child's z-index is scoped within that context, not the whole document.

**How to avoid:** Render `<SignalModal>` as the last element inside App.jsx's outermost `<div style={{ minHeight: '100vh', background: '#FAFBFF' }}>`, not inside a Panel or content wrapper. The `position: fixed` + large z-index will then be relative to the viewport, not a nested context.

**Warning signs:** Modal appears but is partially or fully hidden behind other panels.

---

### Pitfall 3: Recharts onClick signature is `(entry, index, event)` — not `(event)`

**What goes wrong:** Writing `onClick={(e) => onBarClick(e.target.value)}` — this is the DOM event API, not Recharts'. `e.target.value` is undefined.

**Why it happens:** Recharts fires a synthetic click event with a different shape than DOM events.

**How to avoid:** Use `onClick={(entry) => onBarClick(entry.name)}` where `entry` is the data object. For Cell-based charts (with per-bar colors), the onClick goes on `<Bar>`, not on `<Cell>`. [VERIFIED: codebase — CommunityChart.jsx and SeverityChart.jsx both use this correctly]

---

### Pitfall 4: Browser date picker input returns local date but Supabase timestamps are UTC

**What goes wrong:** User picks "April 29" in the date input. The existing `fetchSignalsByDate` constructs `T00:00:00` / `T23:59:59` without a timezone. Supabase interprets these as UTC, but signals created at 11pm EST (03:00 UTC next day) won't appear. [ASSUMED — UTC vs local mismatch is a known pattern in this codebase per RESEARCH.md note in BrowseTab]

**How to avoid:** The existing `fetchSignalsByDate` already acknowledges "UTC boundary — acceptable for an internal dashboard." Keep this behavior — document it, don't fix it. Phase 03 extends the same approach to week/month range fetches.

---

### Pitfall 5: Modal "1 of 1" when opened from a single-signal click (Browse tab row click)

**What goes wrong:** The existing `openSignalDetail` function sets `drawerSignals` to a single-element array `[signal]`. If carried over to the modal, the user sees "1 of 1 signals" and disabled Prev/Next arrows every time they click a Browse row, even though there are many signals loaded.

**How to avoid:** When a signal row is clicked in Browse tab, pass the full `signalsForDate` array (post-filter) and `currentIndex = signalsForDate.indexOf(signal)`. This gives the user the full "N of M" navigation over all signals visible in the table. Update `BrowseTab.jsx` to call `onSignalClick(signal, signalsForDate)` passing both the signal and the full list.

---

### Pitfall 6: Filter pill dropdown z-index behind the signals table

**What goes wrong:** The dropdown (z-index: 100) renders behind the table rows because the table wrapper has its own stacking context.

**How to avoid:** Keep filter pills outside any `overflow: hidden` container. The pills row should be a sibling of the table panel, not inside it. The dropdown's `position: absolute` anchors to the pill wrapper (position: relative), and z-index: 100 is enough since it's not fighting the modal.

---

### Pitfall 7: PostsVsSignalsChart in Pipeline tab — `posts` array vs `signals` array field mismatch

**What goes wrong:** `PostsVsSignalsChart` uses `captured_date` for posts and `created_at` for signals. This is correct. But if you accidentally pass the wrong data array, all dates will be null and the chart shows nothing.

**How to avoid:** In PipelineTab.jsx, pass `signals={signals}` and `posts={posts}` as separate props explicitly. Don't use the same array for both.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Rolling date filters (7d/30d/90d) | Calendar-anchored (Today/Yesterday/Week/Month) | Phase 03 | More precise for weekly review workflows |
| Right-side drawer shelf | Centered modal with Prev/Next | Phase 03 | Faster signal triage, no back-navigation needed |
| Single date picker in Browse | Day/Week/Month/All Time tabs | Phase 03 | Week/month views are the primary CSM use case |

---

## Validation Architecture

> `workflow.nyquist_validation` is not set to false — treating as enabled.

### Test Framework

| Property | Value |
|---|---|
| Framework | None detected in project (no jest.config, no vitest.config, no test/ directory) |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Notes |
|---|---|---|---|
| D-01/02/03 | Modal opens/closes via backdrop, X, Escape | Manual smoke | No test framework installed; verify manually in browser |
| D-10/11 | Calendar date ranges compute correct Mon–Sun boundaries | Unit (pure function) | `getWeekRange`, `getMonthRange` are pure functions — ideal for unit tests |
| D-17 | Status badge shows correct color for churned vs active | Manual smoke | Depends on live Supabase data |
| D-18 | % Preventable stat card computes correctly | Unit (pure derivation) | `preventableCount / tabSignals.length` |
| D-15/16 | Category chart click opens modal with filtered signals | Manual smoke | Integration test — requires browser |

### Wave 0 Gaps

- [ ] No test framework installed — project has no `vitest`, `jest`, or `@testing-library/react`
- [ ] If unit tests are desired for date math utils, add: `npm install -D vitest` and a `vitest.config.js`
- [ ] Core date math functions (`getWeekRange`, `getMonthRange`) are pure and ideal first test targets

*(All Phase 03 verification is currently manual-smoke — this is consistent with Phase 01/02 approach)*

---

## Environment Availability

Step 2.6: SKIPPED — Phase 03 is purely frontend code and inline style changes. No new external services, CLIs, or runtimes are required beyond the existing Node/npm/Vite setup.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UTC/local timezone mismatch in date fetches is "acceptable for internal dashboard" | Pattern 8, Pitfall 4 | If signals appear on wrong day for users in non-UTC timezones, date boundaries need timezone offset adjustment |
| A2 | `status` and `customer_status` columns distinguish Active vs Churned via string values (e.g. "active", "churned") | Pattern 5 | If values use different strings, the badge logic needs updated string matching |
| A3 | `preventability = 'high'` is the correct column value for preventable churn (not 'yes' or '1') | Pattern 6 | If the column uses different values, the stat card shows 0% |
| A4 | Posts `source` column has the same values as signals `source` column (so `normalizeSource` works for posts in Pipeline tab) | Pattern 7 | If posts use different source format, the pipeline community chart shows raw/un-normalized strings |
| A5 | Pipeline tab uses all-time data from the already-fetched `signals` and `posts` arrays — no new Supabase call needed | Pattern 7 | If the arrays are too large (performance), a separate pipeline fetch might be needed |

---

## Open Questions

1. **Week/Month picker UI style (Claude's discretion)**
   - What we know: Week dropdown shows "YYYY-WXX" formatted as human-readable week (e.g., "Apr 20 – Apr 26"). Month shows "April 2026".
   - What's unclear: Native `<select>` is simplest and consistent with existing `<input type="date">`. A custom styled dropdown matches the filter pill pattern better.
   - Recommendation: Use native `<select>` for Week/Month inside the time filter (Churn/E&U tabs) since it's inside the header row where space is tight. Use the custom BrowseFilterPill dropdown pattern for the Browse tab filter pills where visual consistency matters more.

2. **Modal animation (Claude's discretion)**
   - What we know: CSS transitions work via inline style.
   - What's unclear: Fade + slight scale (opacity 0→1, transform scale(0.96→1)) is the most polished approach.
   - Recommendation: Add `opacity` and `transform` transitions to the modal card div. Keep it under 200ms so it feels snappy, not sluggish.

3. **`status` vs `customer_status` column usage**
   - What we know: Both exist in the 37-column schema (visible in SignalDetail.jsx MetaRow rendering).
   - What's unclear: Which column is more reliably populated in practice.
   - Recommendation: Build the StatusBadge with the priority chain `status || customer_status || (churn_date ? 'churned' : null)` as documented in Pattern 5. Log a `console.warn` for signals where all three are null to detect gaps in data.

---

## Sources

### Primary (HIGH confidence)
- `/recharts/recharts` (Context7) — Bar onClick signature, layout="vertical", ResponsiveContainer, Cell pattern
- Codebase: `CommunityChart.jsx`, `SeverityChart.jsx` — verified existing onClick pattern
- Codebase: `aggregate.js` — verified getISOWeekLabel and filterByDateRange patterns
- Codebase: `BrowseTab.jsx` — verified existing date fetch pattern and cancellation pattern

### Secondary (MEDIUM confidence)
- React community standard: `useEffect` + `document.addEventListener('keydown')` with cleanup for Escape key
- React community standard: `useRef` + `document.addEventListener('mousedown')` for click-outside detection

### Tertiary (LOW confidence — see Assumptions Log)
- A1–A5 in Assumptions Log above are based on codebase inference and training knowledge, not live data verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — React 19 + Recharts 3.8.1 verified in package.json; no new libraries needed
- Architecture: HIGH — All patterns derived from existing working codebase code
- Recharts API: HIGH — Verified via Context7 + existing CommunityChart/SeverityChart implementations
- Date math: HIGH — Vanilla JS Date is deterministic; formulas verified against getISOWeekLabel in aggregate.js
- Dropdown/modal patterns: MEDIUM — Community standard patterns; no unit test verification in this codebase
- Data field values (status, preventability): LOW — Assumed from column names; requires live data check

**Research date:** 2026-04-30
**Valid until:** 2026-05-30 (stable libraries, 30-day validity)
