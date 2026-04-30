# Phase 02: Filtering, Drill-downs & Signal Detail - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 11 (4 new, 6 modified, 1 removed from layouts)
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/api/supabase.js` | api-client | request-response | `src/api/supabase.js` (self) | exact — add columns to select string |
| `src/utils/aggregate.js` | utility | transform | `src/utils/aggregate.js` (self) | exact — follow existing reduce/filter patterns |
| `src/App.jsx` | root-container | request-response + event-driven | `src/App.jsx` (self) | exact — extend existing useState pattern |
| `src/components/ui/FilterPills.jsx` | component | event-driven | `src/App.jsx` tab buttons (lines 104–126) | role-match — same pill/toggle button pattern |
| `src/components/ui/SignalDrawer.jsx` | component | event-driven | `src/components/ui/PlaceholderPanel.jsx` + App.jsx Panel (lines 22–31) | partial — fixed overlay is novel; card layout is same pattern |
| `src/components/ui/SignalCard.jsx` | component | request-response | `src/components/ui/StatCard.jsx` | role-match — same card container + label/value field layout |
| `src/components/ui/SignalDetail.jsx` | component | request-response | `src/components/ui/StatCard.jsx` + `SectionHeader.jsx` | role-match — metadata block + labeled sections |
| `src/components/charts/SignalVolumeChart.jsx` | component | event-driven | `src/components/charts/SignalVolumeChart.jsx` (self) | exact — add onClick to existing Bar elements |
| `src/components/charts/CommunityChart.jsx` | component | event-driven | `src/components/charts/CommunityChart.jsx` (self) | exact — add onClick to existing Bar/Cell |
| `src/components/charts/SeverityChart.jsx` | component | event-driven | `src/components/charts/SeverityChart.jsx` (self) | exact — add onClick to existing Bar/Cell |
| `src/components/charts/EnrollmentUpsellSplitChart.jsx` | component | transform | `src/components/charts/SignalVolumeChart.jsx` | exact — same stacked BarChart pattern, different data keys |
| `src/components/charts/EUCommunityChart.jsx` | component | transform | `src/components/charts/CommunityChart.jsx` | role-match — same horizontal BarChart, two bars per entry instead of one |

---

## Pattern Assignments

### `src/api/supabase.js` (api-client, request-response)

**Analog:** `src/api/supabase.js` (self — lines 20–24)

**Current fetchSignals select string** (lines 20–24):
```javascript
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,signal_type,source,match_method,org_name,confidence,severity,routed_at&limit=10000'
  )
}
```

**Change required:** Add `key_quote,summary,suggested_action` to the select string. No other changes. Copy the rest of the file verbatim.

**Target pattern:**
```javascript
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,signal_type,source,match_method,org_name,confidence,severity,routed_at,key_quote,summary,suggested_action&limit=10000'
  )
}
```

**Error handling pattern** (lines 11–15) — do not change:
```javascript
async function fetchSupabase(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
```

---

### `src/utils/aggregate.js` (utility, transform)

**Analog:** `src/utils/aggregate.js` (self)

**Immutable reduce pattern** — copy from `groupByField` (lines 1–7):
```javascript
export function groupByField(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field]
    if (key == null) return acc  // skip null and undefined
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}
```

**forEach + spread immutable pattern** — copy from `groupByWeek` (lines 33–49):
```javascript
export function groupByWeek(rows) {
  const weekMap = {}

  rows.forEach((row) => {
    const date = new Date(row.created_at)
    if (isNaN(date)) return  // skip rows with bad timestamps
    const week = getISOWeekLabel(date)
    if (!weekMap[week]) {
      weekMap[week] = { week, churn: 0, enrollment: 0, upsell: 0 }
    }
    const type = row.signal_type
    if (type === 'churn' || type === 'enrollment' || type === 'upsell') {
      weekMap[week] = { ...weekMap[week], [type]: weekMap[week][type] + 1 }
    }
  })

  return Object.values(weekMap).sort((a, b) => (a.week > b.week ? 1 : -1))
}
```

**New `filterByDateRange` — follow the `.filter()` + null-guard pattern:**
```javascript
// Add after existing exports — same style as countByField/groupByField
export function filterByDateRange(rows, days, dateField = 'created_at') {
  if (!days) return rows  // null means "All" — no filter applied
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= cutoff
  })
}
```

**New `groupBySourceAndType` — follow the `groupByWeek` forEach + spread pattern:**
```javascript
// Add after filterByDateRange
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

**`getISOWeekLabel` — change from unexported helper to named export** (currently line 60):
```javascript
// BEFORE (line 60 — unexported):
function getISOWeekLabel(date) {

// AFTER — add `export` keyword only:
export function getISOWeekLabel(date) {
```

Full function body does not change:
```javascript
export function getISOWeekLabel(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

---

### `src/App.jsx` (root-container, request-response + event-driven)

**Analog:** `src/App.jsx` (self)

**Existing useState pattern** (lines 34–38) — copy this shape for all new state:
```javascript
const [signals, setSignals] = useState([])
const [posts, setPosts] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [activeTab, setActiveTab] = useState('churn')
```

**New state to add immediately after line 38:**
```javascript
// Time period filter — null means "All", number means last N days
const [churnFilter, setChurnFilter] = useState(null)
const [enrollmentFilter, setEnrollmentFilter] = useState(null)

// Drawer state
const [drawerOpen, setDrawerOpen] = useState(false)
const [drawerTitle, setDrawerTitle] = useState('')
const [drawerSignals, setDrawerSignals] = useState([])
const [selectedSignal, setSelectedSignal] = useState(null)
```

**Existing data fetch pattern** (lines 40–53) — do not change:
```javascript
useEffect(() => {
  async function load() {
    try {
      const [signalsData, postsData] = await Promise.all([fetchSignals(), fetchPosts()])
      setSignals(signalsData)
      setPosts(postsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])
```

**Existing tabSignals derivation** (lines 71–74) — extend to add date filter after tab type filter:
```javascript
// CURRENT:
const tabSignals = activeTab === 'churn'
  ? signals.filter((s) => s.signal_type === 'churn')
  : signals.filter((s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell')

// REPLACE WITH (compute activeFilter inline):
const activeFilter = activeTab === 'churn' ? churnFilter : enrollmentFilter

const tabSignals = filterByDateRange(
  activeTab === 'churn'
    ? signals.filter((s) => s.signal_type === 'churn')
    : signals.filter((s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell'),
  activeFilter
)

// Posts use captured_date — separate call with same active filter
const filteredPosts = filterByDateRange(posts, activeFilter, 'captured_date')
```

**Existing tab button pattern** (lines 103–126) — modify outer div to add FilterPills on the right:
```jsx
// CURRENT outer div:
<div style={{ display: 'flex', gap: 0 }}>

// REPLACE WITH (space-between to push pills right):
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <div style={{ display: 'flex', gap: 0 }}>
    {/* existing tab buttons unchanged */}
  </div>
  <FilterPills
    value={activeTab === 'churn' ? churnFilter : enrollmentFilter}
    onChange={(days) =>
      activeTab === 'churn' ? setChurnFilter(days) : setEnrollmentFilter(days)
    }
  />
</div>
```

**Drawer helper functions — add after state declarations, before return:**
```javascript
function openDrawer(title, filteredSignals) {
  setDrawerTitle(title)
  setDrawerSignals(filteredSignals)
  setDrawerOpen(true)
  setSelectedSignal(null)  // always start at signal list, never detail view
}

function closeDrawer() {
  setDrawerOpen(false)
  setSelectedSignal(null)  // reset detail view on close — see RESEARCH.md Pitfall 2
}
```

**Existing error state pattern** (lines 63–69) — copy for any new error surfaces:
```jsx
if (error) {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#D81860', fontSize: 14 }}>Error: {error}</p>
    </div>
  )
}
```

**TopOrgsTable removal:** Delete the import on line 13 and remove both `<TopOrgsTable ... />` usages from layout. The Sources section 2-column grid (lines 179–187) becomes a single full-width `<Panel>` containing only `<CommunityChart>`.

**SignalDrawer placement — add at bottom of return, outside content div, as a sibling to the header:**
```jsx
{/* Render at root level so it overlays everything */}
<SignalDrawer
  open={drawerOpen}
  title={drawerTitle}
  onClose={closeDrawer}
>
  {selectedSignal ? (
    <SignalDetail
      signal={selectedSignal}
      onBack={() => setSelectedSignal(null)}
    />
  ) : (
    <SignalCard
      signals={drawerSignals}
      onSelect={(signal) => setSelectedSignal(signal)}
    />
  )}
</SignalDrawer>
```

---

### `src/components/ui/FilterPills.jsx` (component, event-driven)

**Analog:** Tab buttons in `src/App.jsx` (lines 104–126)

**Tab button pattern to copy** (lines 107–124):
```jsx
<button
  key={tab.id}
  onClick={() => setActiveTab(tab.id)}
  style={{
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: active ? '#0057FF' : '#6B7487',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #0057FF' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  }}
>
  {tab.label}
</button>
```

**FilterPills adapts this pattern with pill shape instead of underline:**
```jsx
// src/components/ui/FilterPills.jsx
const OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
]

export default function FilterPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>
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

---

### `src/components/ui/SignalDrawer.jsx` (component, event-driven)

**Analog:** `src/App.jsx` Panel inline component (lines 22–31) for panel shell; `PlaceholderPanel.jsx` for layout approach.

**Panel shell pattern from App.jsx** (lines 22–31):
```jsx
function Panel({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 20 }}>
      {title && (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', marginBottom: 16 }}>{title}</p>
      )}
      {children}
    </div>
  )
}
```

**SignalDrawer builds on this with fixed overlay + CSS transform slide:**
```jsx
// src/components/ui/SignalDrawer.jsx
export default function SignalDrawer({ open, title, children, onClose }) {
  return (
    // Outer container — always in DOM, pointer-events off when closed (Pitfall 3)
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Backdrop — click to close (D-07) */}
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
      {/* Panel — slides in from right */}
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
          zIndex: 1001,
        }}
      >
        {/* Drawer header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E1E6F2', flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0 }}>{title}</p>
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

---

### `src/components/ui/SignalCard.jsx` (component, request-response)

**Analog:** `src/components/ui/StatCard.jsx` (lines 1–19)

**StatCard container + label/value pattern** (lines 2–19):
```jsx
export default function StatCard({ title, value, subtitle }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E1E6F2',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: '#15181D', margin: 0, lineHeight: 1.2 }}>
        {value === null || value === undefined ? '—' : value}
      </p>
      {subtitle && <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>{subtitle}</p>}
    </div>
  )
}
```

**SignalCard adapts to clickable card with signal fields:**
```jsx
// src/components/ui/SignalCard.jsx
// Renders a single signal as a clickable card inside the drawer
export default function SignalCard({ signal, onClick }) {
  const date = signal.created_at
    ? new Date(signal.created_at).toLocaleDateString('en-US')
    : '—'

  return (
    <div
      onClick={() => onClick(signal)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E1E6F2',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Org name — primary label */}
      <p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0 }}>
        {signal.org_name ?? '—'}
      </p>
      {/* Metadata row — same 12px/400/#6B7487 pattern as StatCard subtitle */}
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>
        {signal.source} · Severity: {signal.severity} · Confidence: {Number(signal.confidence).toFixed(2)}
      </p>
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>
        Match: {signal.match_method} · {date}
      </p>
    </div>
  )
}
```

**For the signal list wrapper (used in App.jsx to render all cards):**
```jsx
// src/components/ui/SignalCard.jsx — also export a list variant
export function SignalCardList({ signals, onSelect }) {
  if (signals.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: 0 }}>No signals found</p>
        <p style={{ fontSize: 12, color: '#6B7487', margin: '8px 0 0' }}>
          No signals match this filter for the selected time period. Try adjusting the time period filter.
        </p>
      </div>
    )
  }
  return (
    <div>
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} onClick={onSelect} />
      ))}
    </div>
  )
}
```

---

### `src/components/ui/SignalDetail.jsx` (component, request-response)

**Analog:** `src/components/ui/SectionHeader.jsx` (lines 1–8) for labeled section pattern; `StatCard.jsx` for value display.

**SectionHeader label pattern** (lines 2–7):
```jsx
<div style={{ marginBottom: 16 }}>
  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: 0 }}>{title}</h2>
  {subtitle && <p style={{ fontSize: 14, color: '#6B7487', margin: '4px 0 0' }}>{subtitle}</p>}
</div>
```

**SignalDetail structure — each section uses the same label + content block:**
```jsx
// src/components/ui/SignalDetail.jsx
export default function SignalDetail({ signal, onBack }) {
  const date = signal.created_at
    ? new Date(signal.created_at).toLocaleDateString('en-US')
    : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Back button — top of detail view (D-11) */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#0057FF',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '16px 24px',
          textAlign: 'left',
          flexShrink: 0,
        }}
      >
        Back to signals
      </button>

      {/* Metadata block — same field list as SignalCard but in grid layout (D-10) */}
      <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #E1E6F2' }}>
        {/* label/value rows — 12px/600/#6B7487 label, 14px/400/#15181D value */}
        {[
          ['Org', signal.org_name],
          ['Source', signal.source],
          ['Signal Type', signal.signal_type],
          ['Severity', signal.severity],
          ['Confidence', Number(signal.confidence).toFixed(2)],
          ['Match Method', signal.match_method],
          ['Created', date],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: 0, minWidth: 100, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: 14, color: '#15181D', margin: 0 }}>{val ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Key Quote section (D-10) */}
      <div style={{ padding: '16px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Key Quote</p>
        {signal.key_quote ? (
          <blockquote style={{
            background: '#F5F7FF',
            borderLeft: '4px solid #0057FF',
            padding: '12px 16px',
            margin: 0,
            fontSize: 14,
            fontStyle: 'italic',
            color: '#15181D',
            lineHeight: 1.6,
          }}>
            {signal.key_quote}
          </blockquote>
        ) : (
          <p style={{ fontSize: 14, color: '#6B7487', margin: 0 }}>—</p>
        )}
      </div>

      {/* Summary section (D-10) */}
      <div style={{ padding: '0 24px 16px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Summary</p>
        <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5 }}>{signal.summary ?? '—'}</p>
      </div>

      {/* Suggested Action section (D-10) */}
      <div style={{ padding: '0 24px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested Action</p>
        {signal.suggested_action ? (
          <div style={{
            background: '#F0FFF6',
            border: '1px solid #B3EAC8',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5 }}>{signal.suggested_action}</p>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#6B7487', margin: 0 }}>—</p>
        )}
      </div>

    </div>
  )
}
```

---

### `src/components/charts/SignalVolumeChart.jsx` (component, event-driven)

**Analog:** `src/components/charts/SignalVolumeChart.jsx` (self — lines 1–27)

**Current Bar elements** (lines 21–23) — no onClick:
```jsx
<Bar dataKey="churn" stackId="a" fill="#D81860" name="Churn" />
<Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" />
<Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" />
```

**Add `onBarClick` prop to component signature and onClick to each Bar:**
```jsx
export default function SignalVolumeChart({ signals, onBarClick }) {
  const data = groupByWeek(signals)

  // ... existing empty check and ResponsiveContainer unchanged ...

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        {/* CartesianGrid, XAxis, YAxis, Tooltip, Legend unchanged */}
        <Bar
          dataKey="churn"
          stackId="a"
          fill="#D81860"
          name="Churn"
          onClick={onBarClick ? (entry) => onBarClick(entry.week) : undefined}
        />
        <Bar
          dataKey="enrollment"
          stackId="a"
          fill="#0057FF"
          name="Enrollment"
          onClick={onBarClick ? (entry) => onBarClick(entry.week) : undefined}
        />
        <Bar
          dataKey="upsell"
          stackId="a"
          fill="#623CC9"
          name="Upsell"
          onClick={onBarClick ? (entry) => onBarClick(entry.week) : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Note:** The click handler in App.jsx must filter `tabSignals` using `getISOWeekLabel` (exported after aggregate.js change) to match `entry.week`. See RESEARCH.md Pitfall 4.

---

### `src/components/charts/CommunityChart.jsx` (component, event-driven)

**Analog:** `src/components/charts/CommunityChart.jsx` (self — lines 1–34)

**Current Bar element** (lines 26–30) — no onClick:
```jsx
<Bar dataKey="count" name="Signals">
  {data.map((_, index) => (
    <Cell key={index} fill={COLORS[index % COLORS.length]} />
  ))}
</Bar>
```

**Add `onBarClick` prop and onClick:**
```jsx
export default function CommunityChart({ signals, onBarClick }) {
  const data = countByField(signals, 'source')

  // ... empty check unchanged ...

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        {/* CartesianGrid, XAxis, YAxis, Tooltip unchanged */}
        <Bar
          dataKey="count"
          name="Signals"
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

---

### `src/components/charts/SeverityChart.jsx` (component, event-driven)

**Analog:** `src/components/charts/SeverityChart.jsx` (self — lines 1–37)

**Current Bar element** (lines 28–32) — no onClick:
```jsx
<Bar dataKey="count" name="Signals">
  {data.map((entry) => (
    <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level] ?? '#9ca3af'} />
  ))}
</Bar>
```

**Add `onBarClick` prop and onClick (filter by `entry.level` since XAxis uses `dataKey="level"`):**
```jsx
export default function SeverityChart({ signals, onBarClick }) {
  // ... existing counts reduce and data map unchanged ...

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        {/* CartesianGrid, XAxis, YAxis, Tooltip unchanged */}
        <Bar
          dataKey="count"
          name="Signals"
          onClick={onBarClick ? (entry) => onBarClick(entry.level) : undefined}
        >
          {data.map((entry) => (
            <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level] ?? '#9ca3af'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

### `src/components/charts/EnrollmentUpsellSplitChart.jsx` (component, transform)

**Analog:** `src/components/charts/SignalVolumeChart.jsx` (lines 1–27) — exact same stacked BarChart pattern, different data shape.

**Full SignalVolumeChart pattern to copy** (lines 1–27):
```jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek } from '../../utils/aggregate'

export default function SignalVolumeChart({ signals }) {
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="churn" stackId="a" fill="#D81860" name="Churn" />
        <Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" />
        <Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**EnrollmentUpsellSplitChart adapts this — same import block, same ResponsiveContainer, only enrollment and upsell bars, XAxis key is `week`:**
```jsx
// src/components/charts/EnrollmentUpsellSplitChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek } from '../../utils/aggregate'

export default function EnrollmentUpsellSplitChart({ signals }) {
  // groupByWeek already produces { week, churn, enrollment, upsell } — only render enrollment + upsell
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" />
        <Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

### `src/components/charts/EUCommunityChart.jsx` (component, transform)

**Analog:** `src/components/charts/CommunityChart.jsx` (lines 1–34) — same horizontal BarChart pattern; two named bars per entry instead of one Cell-colored bar.

**CommunityChart import and layout pattern to copy** (lines 1–16):
```jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { countByField } from '../../utils/aggregate'
```

**EUCommunityChart adapts — uses `groupBySourceAndType` (new utility), two Bar elements with fixed fill instead of Cell:**
```jsx
// src/components/charts/EUCommunityChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupBySourceAndType } from '../../utils/aggregate'

export default function EUCommunityChart({ signals }) {
  const data = groupBySourceAndType(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="enrollment" fill="#0057FF" name="Enrollment" />
        <Bar dataKey="upsell" fill="#623CC9" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

## Shared Patterns

### Inline Style with Compass Tokens
**Source:** `src/components/ui/StatCard.jsx` (lines 2–19), `src/App.jsx` (lines 22–31)
**Apply to:** All new components (FilterPills, SignalDrawer, SignalCard, SignalDetail, EnrollmentUpsellSplitChart, EUCommunityChart)

Token values:
```
Background (page): #FAFBFF
Background (card/panel): #FFFFFF
Accent / primary: #0057FF
Border: #E1E6F2
Text primary: #15181D
Text secondary: #6B7487
Churn red: #D81860
Enrollment blue: #0057FF
Upsell purple: #623CC9
Success green: #00A344
```

Rule: No Tailwind class names in any new component. All styles are inline `style={{ }}` objects.

### Empty State Pattern
**Source:** `src/components/ui/PlaceholderPanel.jsx` (lines 1–19)
**Apply to:** SignalCard list view in drawer (when drawerSignals is empty)

```jsx
// Drawer empty state — from PlaceholderPanel.jsx structure
<div style={{ textAlign: 'center', padding: '32px 0' }}>
  <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: 0 }}>No signals found</p>
  <p style={{ fontSize: 12, color: '#6B7487', margin: '8px 0 0', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
    No signals match this filter for the selected time period. Try adjusting the time period filter.
  </p>
</div>
```

### Error State Pattern
**Source:** `src/App.jsx` (lines 63–69)
**Apply to:** Any fetch errors in supabase.js; consistent error display in App.jsx

```jsx
<p style={{ color: '#D81860', fontSize: 14 }}>Error: {error}</p>
```

### Recharts ResponsiveContainer Wrapper
**Source:** All chart components (e.g. `src/components/charts/SignalVolumeChart.jsx` lines 13–26)
**Apply to:** EnrollmentUpsellSplitChart, EUCommunityChart

```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

### Null Guard Pattern
**Source:** `src/utils/aggregate.js` lines 3–5, `src/components/ui/StatCard.jsx` line 13
**Apply to:** All new utilities and components that render data that may be null

```javascript
// In utilities:
if (key == null) return acc  // skip null and undefined

// In components:
{value === null || value === undefined ? '—' : value}
```

### Immutable Spread Pattern
**Source:** `src/utils/aggregate.js` (lines 5, 44, 47)
**Apply to:** `filterByDateRange`, `groupBySourceAndType` in aggregate.js

```javascript
// CORRECT — always return new object, never mutate
return { ...acc, [key]: (acc[key] ?? 0) + 1 }
weekMap[week] = { ...weekMap[week], [type]: weekMap[week][type] + 1 }
```

---

## No Analog Found

All files in this phase have close analogs in the existing codebase. No files require falling back to RESEARCH.md patterns as the primary reference.

---

## Metadata

**Analog search scope:** `src/api/`, `src/utils/`, `src/components/ui/`, `src/components/charts/`, `src/App.jsx`
**Files scanned:** 13 source files
**Pattern extraction date:** 2026-04-29
