# Phase 04: Browse UX & Data Clarity - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 4 files to modify (App.jsx, BrowseTab.jsx, PipelineTab.jsx, SignalVolumeChart.jsx — guard kept at call site)
**Analogs found:** 4 / 4

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/App.jsx` | component / state orchestrator | request-response, CRUD | `src/App.jsx` itself (existing state blocks) | exact — adding to existing pattern |
| `src/components/ui/BrowseTab.jsx` | component / list view | request-response, CRUD | `src/App.jsx` (filter state), `src/components/ui/FilterPills.jsx` (pill UI) | exact |
| `src/components/ui/PipelineTab.jsx` | component / stat display | request-response | `src/components/ui/PipelineTab.jsx` itself (existing BigStat) | exact |
| `src/components/charts/SignalVolumeChart.jsx` (guard at call site in App.jsx) | chart component | transform | `src/components/charts/MatchRateChart.jsx` (empty-state guard pattern) | role-match |

---

## Pattern Assignments

### Task 1: `src/App.jsx` — Match filter state for Churn and E&U tabs (D-03 to D-05)

**Analog:** `src/App.jsx` lines 48-50 (existing time filter state block)

**State pattern to copy** (lines 48-50):
```javascript
// Existing — this is the exact shape to copy for match filter state
const [churnTimeFilter, setChurnTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
const [enrollmentTimeFilter, setEnrollmentTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })

// Phase 04 ADDITION — match filter state, one per tab, simple string (not object)
const [churnMatchFilter, setChurnMatchFilter] = useState('all')       // 'all' | 'matched' | 'unmatched'
const [enrollmentMatchFilter, setEnrollmentMatchFilter] = useState('all')
```

**Match predicate pattern** — analog: `src/components/charts/MatchRateChart.jsx` line 4:
```javascript
// MatchRateChart.jsx line 4 — the EXACT predicate already used for match logic
const matched = signals.filter((s) => s.match_method != null && s.match_method !== 'not_found').length

// App.jsx line 133-135 — same predicate, already in the file
const matchedSignals = tabSignals.filter(
  (s) => s.match_method != null && s.match_method !== 'not_found'
)
```

**Filter application pattern** (lines 121-122 — copy this shape for match filter):
```javascript
// Existing — tabSignals is time-filtered only; used by charts and stat cards
const tabSignals = filterByTimeFilter(tabSignalsByType, activeTimeFilter)

// Phase 04 ADDITION — displayedTabSignals is time-filtered AND match-filtered
// Used ONLY by the signal list — NOT by charts, stat cards, or click handlers
const activeMatchFilter = isChurn ? churnMatchFilter : enrollmentMatchFilter
const displayedTabSignals = tabSignals.filter((s) => {
  if (activeMatchFilter === 'matched') return s.match_method != null && s.match_method !== 'not_found'
  if (activeMatchFilter === 'unmatched') return s.match_method === 'not_found'
  return true // 'all'
})
```

**CRITICAL SEPARATION:** All existing references to `tabSignals` (charts, stat cards, click handlers) stay on `tabSignals`. Only the signal list rows use `displayedTabSignals`. This is enforced by Pitfall 2 in RESEARCH.md.

**Match filter tab row UI** — analog: `src/components/ui/FilterPills.jsx` lines 8-19 (pillStyle function) and `src/components/ui/BrowseTab.jsx` lines 248-271 (inline tab row pattern):
```javascript
// pillStyle from FilterPills.jsx lines 8-19 — copy this function verbatim for match pills
function pillStyle(active) {
  return {
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
    background: active ? '#0057FF' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#6B7487',
    cursor: 'pointer',
    minHeight: 36,
  }
}

// Render the match filter row inline (no separate component needed)
// Place directly above the signal list rows in the Churn/E&U tab section
const matchOptions = [
  { value: 'all', label: 'All' },
  { value: 'matched', label: 'Matched' },
  { value: 'unmatched', label: 'Unmatched' },
]

<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
  {matchOptions.map((opt) => (
    <button
      key={opt.value}
      onClick={() => isChurn ? setChurnMatchFilter(opt.value) : setEnrollmentMatchFilter(opt.value)}
      style={pillStyle(activeMatchFilter === opt.value)}
    >
      {opt.label}
    </button>
  ))}
</div>
```

---

### Task 2: `src/components/ui/BrowseTab.jsx` — Scroll bounds + Browse match filter (D-01, D-02, D-03 to D-05)

#### Sub-task A: Scroll bounds

**Analog:** `src/components/ui/BrowseTab.jsx` lines 339-368 (signals section rows) and 387-422 (posts section rows)

**Before pattern** (lines 340-368 — signals rows rendered directly in a div):
```javascript
// Current — no scroll constraint
<div>
  <div style={tableHeaderRowStyle}>
    <span>Org</span>
    <span>Signal Type</span>
    ...
  </div>
  {displayedSignals.map((s) => (
    <div key={s.id} ... style={tableRowStyle(true)}>...</div>
  ))}
</div>
```

**After pattern — wrap ONLY the .map() output, not the header row** (D-02):
```javascript
// Phase 04 — header stays outside scroll container so column labels stay visible
<div>
  <div style={tableHeaderRowStyle}>
    <span>Org</span>
    <span>Signal Type</span>
    ...
  </div>
  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
    {displayedSignals.map((s) => (
      <div key={s.id} ... style={tableRowStyle(true)}>...</div>
    ))}
  </div>
</div>
```

**Same pattern applies to posts section** — wrap the `postsForDate.map()` rows at lines 387-422, leaving `postsHeaderRowStyle` div outside the scroll container.

#### Sub-task B: Browse match filter state

**Analog:** `src/components/ui/BrowseTab.jsx` lines 132-144 (existing filter state block and granularity reset useEffect)

**State pattern to copy** (lines 132-144):
```javascript
// Existing filter state — copy this shape exactly
const [sourceFilter, setSourceFilter] = useState(null)
const [severityFilter, setSeverityFilter] = useState(null)
const [typeFilter, setTypeFilter] = useState(null)
const [confidenceFilter, setConfidenceFilter] = useState(null)

// Phase 04 ADDITION — match filter state, same shape (simple string, not null)
const [matchFilter, setMatchFilter] = useState('all') // 'all' | 'matched' | 'unmatched'

// Existing granularity reset effect — lines 139-144
// MUST add setMatchFilter('all') here per Pitfall 3 in RESEARCH.md
useEffect(() => {
  setSourceFilter(null)
  setSeverityFilter(null)
  setTypeFilter(null)
  setConfidenceFilter(null)
  setMatchFilter('all')  // Phase 04 ADDITION
}, [granularity])
```

**displayedSignals filter pattern to extend** (lines 228-240):
```javascript
// Existing — AND logic, each filter adds one condition
const displayedSignals = signalsForDate.filter((s) => {
  if (sourceFilter && normalizeSource(s.source) !== sourceFilter) return false
  if (severityFilter && s.severity !== severityFilter) return false
  if (typeFilter && s.signal_type !== typeFilter) return false
  if (confidenceFilter) {
    const conf = parseFloat(s.confidence)
    const [loStr, hiStr] = confidenceFilter.split('–')
    const lo = parseFloat(loStr)
    const hi = parseFloat(hiStr)
    if (isNaN(conf) || conf < lo || conf > hi) return false
  }
  // Phase 04 ADDITION — match filter condition (same AND logic)
  if (matchFilter === 'matched' && !(s.match_method != null && s.match_method !== 'not_found')) return false
  if (matchFilter === 'unmatched' && s.match_method !== 'not_found') return false
  return true
})
```

**Match filter tab row UI — analog:** `src/components/ui/BrowseTab.jsx` lines 248-271 (granularity tab row). Use the same `pillStyle` from FilterPills.jsx (see Task 1 above). Render the row inside the signals section panel (line 322 area), below the `BrowseFilterPill` row and above the table header row.

---

### Task 3: `src/App.jsx` — Sub-7-day chart guard (D-06, D-07)

**Analog:** `src/components/charts/SignalVolumeChart.jsx` lines 9-11 (existing empty-state guard pattern) and `src/components/charts/MatchRateChart.jsx` lines 13-15 (same guard shape)

**Empty-state guard pattern to mirror** (SignalVolumeChart.jsx lines 9-11):
```javascript
// Existing empty-state guard in SignalVolumeChart — same conditional render shape
if (data.length === 0) {
  return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
}
```

**Sub-7-day guard — apply at call site in App.jsx** (near line 284-288):
```javascript
// Existing Signal Volume section — App.jsx lines 284-289
<div style={{ marginBottom: 32 }}>
  <SectionHeader title="Signal Volume" subtitle="Signals detected per week" />
  <Panel title="Signals by Week">
    <SignalVolumeChart signals={tabSignals} onBarClick={handleWeekClick} mode={isChurn ? 'churn' : 'eu'} />
  </Panel>
</div>

// Phase 04 replacement — add isSubWeek boolean before the return (near line 115 area):
const isSubWeek = activeTimeFilter.mode === 'today' || activeTimeFilter.mode === 'yesterday'

// Then replace the Panel contents conditionally:
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

**Style tokens used** — muted text `color: '#6B7487'`, primary text `color: '#15181D'` — consistent with existing stat display in `src/components/ui/PipelineTab.jsx` BigStat component (lines 26-27).

---

### Task 4: `src/components/ui/PipelineTab.jsx` — Posts Ingested pipeline delay note (D-08, D-09)

**Analog:** `src/components/ui/PipelineTab.jsx` lines 16-30 (BigStat component definition) and lines 53-57 (Posts Ingested BigStat usage)

**BigStat sub prop pattern** (lines 16-30):
```javascript
// BigStat renders sub prop here — line 27
{sub && <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>{sub}</p>}
```

**Current Posts Ingested BigStat** (lines 53-57):
```javascript
<BigStat
  label="Posts Ingested"
  value={totalPosts.toLocaleString()}
  sub="All-time community posts scraped"
/>
```

**Phase 04 change — update sub string only, no structural change:**
```javascript
<BigStat
  label="Posts Ingested"
  value={totalPosts.toLocaleString()}
  sub="All-time community posts scraped · Updated daily through yesterday"
/>
```

Per D-08: the `sub` string is **unconditional** — no ternary, no condition based on time filter. Per D-09: styling is already correct because BigStat renders `sub` at `fontSize: 12, color: '#6B7487'` which matches the design token spec exactly.

---

## Shared Patterns

### Pill button style (active / inactive states)
**Source:** `src/components/ui/FilterPills.jsx` lines 8-19
**Apply to:** Match filter tab row in App.jsx (Churn/E&U) and BrowseTab.jsx (Browse signals section)
```javascript
function pillStyle(active) {
  return {
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
    background: active ? '#0057FF' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#6B7487',
    cursor: 'pointer',
    minHeight: 36,
  }
}
```

### Match predicate (matched vs unmatched)
**Source:** `src/components/charts/MatchRateChart.jsx` line 4 and `src/App.jsx` line 133
**Apply to:** All three match filter locations (App.jsx Churn, App.jsx E&U, BrowseTab.jsx)
```javascript
// Matched: match_method is not null AND not 'not_found'
s.match_method != null && s.match_method !== 'not_found'
// Unmatched: match_method is exactly 'not_found'
s.match_method === 'not_found'
```

### Empty / fallback state display
**Source:** `src/components/charts/SignalVolumeChart.jsx` line 10, `src/components/charts/MatchRateChart.jsx` line 14
**Apply to:** Sub-7-day chart guard fallback stat display in App.jsx
```javascript
// Shape to copy for the sub-7-day inline stat
<p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
```

### Scroll container wrapper (rows only, not header)
**Source:** `src/components/ui/BrowseTab.jsx` lines 339-368 (current unscrolled rows pattern)
**Apply to:** Both the signals section and posts section in BrowseTab.jsx
```javascript
// The div wrapping .map() output gets these two properties; nothing else changes
{ maxHeight: 400, overflowY: 'auto' }
```

### Design tokens
**Source:** `src/components/ui/FilterPills.jsx` and `src/components/ui/PipelineTab.jsx`
**Apply to:** All new UI elements in this phase
```javascript
// Primary blue (active pills, links)
'#0057FF'
// Border / inactive pill border
'#E1E6F2'
// Muted text (labels, sub text)
'#6B7487'
// Primary text
'#15181D'
// Background
'#FAFBFF'
```

---

## No Analog Found

None. All four changes have direct analogs in the codebase. No RESEARCH.md fallback patterns needed.

---

## Metadata

**Analog search scope:** `src/App.jsx`, `src/components/ui/BrowseTab.jsx`, `src/components/ui/PipelineTab.jsx`, `src/components/ui/FilterPills.jsx`, `src/components/charts/SignalVolumeChart.jsx`, `src/components/charts/MatchRateChart.jsx`
**Files scanned:** 6
**Pattern extraction date:** 2026-05-01
