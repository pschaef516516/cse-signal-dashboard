# CSE Signal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React dashboard that reads from Supabase and displays all CSE signal pipeline metrics — live panels wired to real data, placeholder panels for future data.

**Architecture:** Vite + React single-page app; all data fetched client-side from Supabase REST API using fetch(); aggregation done in browser since PostgREST doesn't support GROUP BY; deployed to Vercel via GitHub with environment variables for credentials.

**Tech Stack:** React 18, Vite, Recharts (charts), Tailwind CSS (layout/styling), Supabase REST API (PostgREST), Vercel

---

## File Map

```
/
├── index.html                          # Vite entry point
├── vite.config.js                      # Vite config
├── tailwind.config.js                  # Tailwind config
├── postcss.config.js                   # PostCSS (required by Tailwind)
├── package.json                        # Dependencies
├── .env.example                        # Template for env vars (committed)
├── .env.local                          # Real credentials (gitignored)
├── .gitignore
├── vercel.json                         # Vercel SPA routing config
└── src/
    ├── main.jsx                        # React root mount
    ├── App.jsx                         # Top-level layout + data orchestration
    ├── api/
    │   └── supabase.js                 # All Supabase REST fetch calls
    ├── utils/
    │   └── aggregate.js                # Pure functions: groupBy, count, bucket
    ├── components/
    │   ├── ui/
    │   │   ├── StatCard.jsx            # Single-number KPI card
    │   │   ├── PlaceholderPanel.jsx    # "Coming soon" panel with label
    │   │   └── SectionHeader.jsx      # Section title + subtitle
    │   └── charts/
    │       ├── SignalVolumeChart.jsx   # Stacked bar: churn/enrollment/upsell by week
    │       ├── CommunityChart.jsx      # Bar: signals by FB group (source)
    │       ├── MatchRateChart.jsx      # Pie/donut: matched vs unmatched
    │       ├── MatchByTypeChart.jsx    # Grouped bar: matched vs unmatched per type
    │       ├── TopOrgsTable.jsx        # Ranked table: org_name + count
    │       ├── ConfidenceHistogram.jsx # Histogram: confidence 0.0–1.0
    │       ├── SeverityChart.jsx       # Bar: low / medium / high
    │       └── PostsVsSignalsChart.jsx # Line: posts ingested vs signals by date
└── tests/
    └── utils/
        └── aggregate.test.js           # Unit tests for aggregate.js (pure functions)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize the project**

```bash
cd "/Users/pschaef516/CSE- Dashboard"
npm create vite@latest . -- --template react
```

When prompted "Current directory is not empty. Remove existing files and continue?" — type `y`.
When asked framework: select `React`. When asked variant: select `JavaScript`.

- [ ] **Step 2: Install dependencies**

```bash
npm install recharts tailwindcss @tailwindcss/vite autoprefixer
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Tailwind**

Replace contents of `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
})
```

Create `src/test-setup.js`:
```javascript
import '@testing-library/jest-dom'
```

Create `src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Update package.json test script**

In `package.json`, add to the `scripts` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create .env.example**

```bash
cat > .env.example << 'EOF'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

- [ ] **Step 6: Create .env.local with real values**

```bash
cp .env.example .env.local
# Then open .env.local and fill in real values from your n8n credential / .env file
```

Patrick: your Supabase project URL is the one in n8n's "Signal Engine Key" credential. The anon key is the public one (not service_role).

- [ ] **Step 7: Update .gitignore**

Open `.gitignore` and confirm these lines exist (add if missing):
```
.env.local
.env
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite prints a localhost URL (e.g. `http://localhost:5173`). Open it in browser — you should see the default Vite + React page. Stop the server with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: initialize Vite + React + Tailwind + Vitest project scaffold"
```

---

## Task 2: Supabase API Client

**Files:**
- Create: `src/api/supabase.js`

This file contains all the data-fetching functions. Each function calls the Supabase REST API and returns raw rows. Aggregation is done separately (Task 3). All functions are async and throw on HTTP errors.

- [ ] **Step 1: Create src/api/supabase.js**

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
}

async function fetchSupabase(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Fetch all signals — only columns the dashboard needs
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,signal_type,source,match_method,org_name,confidence,severity,routed_at,actioned_at'
  )
}

// Fetch all posts — only columns the dashboard needs
export async function fetchPosts() {
  return fetchSupabase('posts?select=captured_date,source')
}
```

- [ ] **Step 2: Verify the file is importable**

Create a quick smoke test. In `src/App.jsx`, add a temporary import line at the top:
```javascript
import { fetchSignals, fetchPosts } from './api/supabase'
```

Run `npm run dev` and open the browser console — confirm no import errors. Remove the import after confirming. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add src/api/supabase.js
git commit -m "feat: add Supabase REST API client with fetchSignals and fetchPosts"
```

---

## Task 3: Aggregation Utilities (TDD)

**Files:**
- Create: `src/utils/aggregate.js`
- Create: `tests/utils/aggregate.test.js`

These are pure functions. No network calls, no React. Easy to test.

- [ ] **Step 1: Write failing tests**

Create `tests/utils/aggregate.test.js`:
```javascript
import { describe, it, expect } from 'vitest'
import {
  groupByField,
  countByField,
  bucketConfidence,
  groupByWeek,
  getUniqueOrgs,
} from '../../src/utils/aggregate'

describe('groupByField', () => {
  it('groups rows by a field value', () => {
    const rows = [
      { type: 'churn' },
      { type: 'churn' },
      { type: 'enrollment' },
    ]
    const result = groupByField(rows, 'type')
    expect(result).toEqual({ churn: 2, enrollment: 1 })
  })

  it('returns empty object for empty array', () => {
    expect(groupByField([], 'type')).toEqual({})
  })
})

describe('countByField', () => {
  it('counts occurrences and sorts descending', () => {
    const rows = [
      { source: 'GroupA' },
      { source: 'GroupB' },
      { source: 'GroupA' },
      { source: 'GroupA' },
    ]
    const result = countByField(rows, 'source')
    expect(result[0]).toEqual({ name: 'GroupA', count: 3 })
    expect(result[1]).toEqual({ name: 'GroupB', count: 1 })
  })
})

describe('bucketConfidence', () => {
  it('buckets confidence scores into 0.1-wide bins', () => {
    const rows = [
      { confidence: 0.85 },
      { confidence: 0.92 },
      { confidence: 0.45 },
    ]
    const result = bucketConfidence(rows)
    // 0.85 and 0.92 should both be in the 0.8–0.9 and 0.9–1.0 buckets respectively
    const bucket08 = result.find((b) => b.range === '0.8–0.9')
    const bucket09 = result.find((b) => b.range === '0.9–1.0')
    const bucket04 = result.find((b) => b.range === '0.4–0.5')
    expect(bucket08.count).toBe(1)
    expect(bucket09.count).toBe(1)
    expect(bucket04.count).toBe(1)
  })
})

describe('groupByWeek', () => {
  it('groups rows by ISO week and signal type', () => {
    const rows = [
      { created_at: '2026-04-21T10:00:00Z', signal_type: 'churn' },
      { created_at: '2026-04-22T10:00:00Z', signal_type: 'enrollment' },
      { created_at: '2026-04-28T10:00:00Z', signal_type: 'churn' },
    ]
    const result = groupByWeek(rows)
    // Week of Apr 21 and Apr 28 should be separate entries
    expect(result.length).toBeGreaterThanOrEqual(2)
    // Each entry has week, churn, enrollment, upsell
    expect(result[0]).toHaveProperty('week')
    expect(result[0]).toHaveProperty('churn')
    expect(result[0]).toHaveProperty('enrollment')
    expect(result[0]).toHaveProperty('upsell')
  })
})

describe('getUniqueOrgs', () => {
  it('returns distinct org_names for a given signal type', () => {
    const rows = [
      { org_name: 'Acme HVAC', signal_type: 'churn' },
      { org_name: 'Acme HVAC', signal_type: 'churn' },
      { org_name: 'Best Plumbing', signal_type: 'churn' },
      { org_name: 'Cool Co', signal_type: 'enrollment' },
    ]
    const churnOrgs = getUniqueOrgs(rows, ['churn'])
    expect(churnOrgs).toBe(2)

    const enrollOrgs = getUniqueOrgs(rows, ['enrollment', 'upsell'])
    expect(enrollOrgs).toBe(1)
  })

  it('ignores null org_names', () => {
    const rows = [
      { org_name: null, signal_type: 'churn' },
      { org_name: 'Acme HVAC', signal_type: 'churn' },
    ]
    expect(getUniqueOrgs(rows, ['churn'])).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
npm test
```

Expected: All 6+ tests fail with "Cannot find module" or similar. Good — tests exist, implementation doesn't yet.

- [ ] **Step 3: Write the implementation**

Create `src/utils/aggregate.js`:
```javascript
// Groups rows by a single field and returns { fieldValue: count }
export function groupByField(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field]
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}

// Returns array of { name, count } sorted by count descending
export function countByField(rows, field) {
  const counts = groupByField(rows, field)
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

// Buckets confidence values (0.0–1.0) into 0.1-wide bins
// Returns array of { range, count } for each bin
export function bucketConfidence(rows) {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
    count: 0,
  }))

  rows.forEach((row) => {
    const val = parseFloat(row.confidence)
    if (isNaN(val)) return
    const binIndex = Math.min(Math.floor(val * 10), 9)
    bins[binIndex] = { ...bins[binIndex], count: bins[binIndex].count + 1 }
  })

  return bins
}

// Groups rows by ISO week (Monday-based) and returns array of
// { week: 'YYYY-Www', churn: N, enrollment: N, upsell: N } sorted chronologically
export function groupByWeek(rows) {
  const weekMap = {}

  rows.forEach((row) => {
    const date = new Date(row.created_at)
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

// Returns the count of distinct non-null org_names for rows matching any of the given signal types
export function getUniqueOrgs(rows, signalTypes) {
  const orgs = new Set(
    rows
      .filter((r) => signalTypes.includes(r.signal_type) && r.org_name != null)
      .map((r) => r.org_name)
  )
  return orgs.size
}

// Returns 'YYYY-Www' label for a Date, e.g. '2026-W17'
function getISOWeekLabel(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npm test
```

Expected: All tests pass. If any fail, check the error message and fix the implementation.

- [ ] **Step 5: Commit**

```bash
git add src/utils/aggregate.js tests/utils/aggregate.test.js src/test-setup.js
git commit -m "feat: add aggregation utilities with full test coverage"
```

---

## Task 4: UI Primitives — StatCard, PlaceholderPanel, SectionHeader

**Files:**
- Create: `src/components/ui/StatCard.jsx`
- Create: `src/components/ui/PlaceholderPanel.jsx`
- Create: `src/components/ui/SectionHeader.jsx`

- [ ] **Step 1: Create StatCard**

```jsx
// src/components/ui/StatCard.jsx
export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900">
        {value === null || value === undefined ? '—' : value}
      </p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create PlaceholderPanel**

```jsx
// src/components/ui/PlaceholderPanel.jsx
export default function PlaceholderPanel({ title, description }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center gap-2 min-h-[180px]">
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 text-center max-w-xs">{description}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create SectionHeader**

```jsx
// src/components/ui/SectionHeader.jsx
export default function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add StatCard, PlaceholderPanel, SectionHeader UI primitives"
```

---

## Task 5: Signal Volume by Week Chart

**Files:**
- Create: `src/components/charts/SignalVolumeChart.jsx`

Shows churn / enrollment / upsell counts stacked by week. Uses `groupByWeek` from Task 3.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/SignalVolumeChart.jsx
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
        <Bar dataKey="churn" stackId="a" fill="#ef4444" name="Churn" />
        <Bar dataKey="enrollment" stackId="a" fill="#3b82f6" name="Enrollment" />
        <Bar dataKey="upsell" stackId="a" fill="#10b981" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/SignalVolumeChart.jsx
git commit -m "feat: add SignalVolumeChart stacked bar by week"
```

---

## Task 6: Signal Volume by Community Chart

**Files:**
- Create: `src/components/charts/CommunityChart.jsx`

Shows which Facebook group produces the most signals. Uses `countByField(signals, 'source')`.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/CommunityChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { countByField } from '../../utils/aggregate'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff']

export default function CommunityChart({ signals }) {
  const data = countByField(signals, 'source')

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
        <Bar dataKey="count" name="Signals">
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/CommunityChart.jsx
git commit -m "feat: add CommunityChart horizontal bar by FB group"
```

---

## Task 7: Match Rate Charts

**Files:**
- Create: `src/components/charts/MatchRateChart.jsx`
- Create: `src/components/charts/MatchByTypeChart.jsx`

MatchRateChart: donut showing matched vs unmatched overall.
MatchByTypeChart: grouped bar showing matched vs unmatched per signal type.

- [ ] **Step 1: Create MatchRateChart**

```jsx
// src/components/charts/MatchRateChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MatchRateChart({ signals }) {
  const matched = signals.filter((s) => s.match_method != null).length
  const unmatched = signals.length - matched
  const pct = signals.length > 0 ? Math.round((matched / signals.length) * 100) : 0

  const data = [
    { name: 'Matched', value: matched },
    { name: 'Unmatched', value: unmatched },
  ]

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold text-gray-900">{pct}%</p>
      <p className="text-sm text-gray-500">of signals matched to an HCP org</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            <Cell fill="#10b981" />
            <Cell fill="#e5e7eb" />
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Create MatchByTypeChart**

```jsx
// src/components/charts/MatchByTypeChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function MatchByTypeChart({ signals }) {
  const types = ['churn', 'enrollment', 'upsell']

  const data = types.map((type) => {
    const subset = signals.filter((s) => s.signal_type === type)
    return {
      type,
      Matched: subset.filter((s) => s.match_method != null).length,
      Unmatched: subset.filter((s) => s.match_method == null).length,
    }
  })

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Matched" fill="#10b981" />
        <Bar dataKey="Unmatched" fill="#e5e7eb" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/charts/MatchRateChart.jsx src/components/charts/MatchByTypeChart.jsx
git commit -m "feat: add MatchRateChart donut and MatchByTypeChart grouped bar"
```

---

## Task 8: Top Orgs Table

**Files:**
- Create: `src/components/charts/TopOrgsTable.jsx`

Shows the top 10 org_names by signal count.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/TopOrgsTable.jsx
import { countByField } from '../../utils/aggregate'

export default function TopOrgsTable({ signals }) {
  const matched = signals.filter((s) => s.org_name != null)
  const rows = countByField(matched, 'org_name').slice(0, 10)

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No matched signals yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="pb-2 font-semibold text-gray-600">#</th>
          <th className="pb-2 font-semibold text-gray-600">Org Name</th>
          <th className="pb-2 font-semibold text-gray-600 text-right">Signals</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 text-gray-400">{i + 1}</td>
            <td className="py-2 text-gray-800">{row.name}</td>
            <td className="py-2 text-right font-medium text-gray-900">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/TopOrgsTable.jsx
git commit -m "feat: add TopOrgsTable showing top 10 orgs by signal count"
```

---

## Task 9: Confidence Histogram

**Files:**
- Create: `src/components/charts/ConfidenceHistogram.jsx`

Distribution of Claude's confidence scores from 0.0 to 1.0.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/ConfidenceHistogram.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { bucketConfidence } from '../../utils/aggregate'

export default function ConfidenceHistogram({ signals }) {
  const data = bucketConfidence(signals)

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#6366f1" name="Signals" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/ConfidenceHistogram.jsx
git commit -m "feat: add ConfidenceHistogram for Claude confidence scores"
```

---

## Task 10: Severity Chart

**Files:**
- Create: `src/components/charts/SeverityChart.jsx`

Bar chart of low / medium / high signal severity.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/SeverityChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SEVERITY_COLORS = { low: '#fbbf24', medium: '#f97316', high: '#ef4444' }
const ORDER = ['low', 'medium', 'high']

export default function SeverityChart({ signals }) {
  const counts = signals.reduce((acc, s) => {
    const key = s.severity ?? 'unknown'
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})

  const data = ORDER.map((level) => ({
    level,
    count: counts[level] ?? 0,
  }))

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="level" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Signals">
          {data.map((entry) => (
            <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level] ?? '#9ca3af'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/SeverityChart.jsx
git commit -m "feat: add SeverityChart bar with color-coded severity levels"
```

---

## Task 11: Posts Ingested vs Signals Generated Chart

**Files:**
- Create: `src/components/charts/PostsVsSignalsChart.jsx`

Line chart overlaying daily posts ingested (from `posts` table) vs signals generated (from `signals` table). Shows the pipeline conversion rate visually.

- [ ] **Step 1: Create the component**

```jsx
// src/components/charts/PostsVsSignalsChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function countByDate(rows, dateField) {
  return rows.reduce((acc, row) => {
    const date = row[dateField]
      ? new Date(row[dateField]).toISOString().slice(0, 10)
      : null
    if (!date) return acc
    return { ...acc, [date]: (acc[date] ?? 0) + 1 }
  }, {})
}

export default function PostsVsSignalsChart({ signals, posts }) {
  const signalsByDate = countByDate(signals, 'created_at')
  const postsByDate = countByDate(posts, 'captured_date')

  const allDates = Array.from(
    new Set([...Object.keys(signalsByDate), ...Object.keys(postsByDate)])
  ).sort()

  const data = allDates.map((date) => ({
    date,
    Posts: postsByDate[date] ?? 0,
    Signals: signalsByDate[date] ?? 0,
  }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Posts" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Signals" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/charts/PostsVsSignalsChart.jsx
git commit -m "feat: add PostsVsSignalsChart line chart comparing ingestion to classification"
```

---

## Task 12: App.jsx — Data Loading + Full Dashboard Layout

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css` (already set up)

This is the final assembly. Fetches all data once on mount, passes it down to every chart component, and lays out the full dashboard. Placeholder panels are wired in for future columns.

- [ ] **Step 1: Replace src/App.jsx**

```jsx
// src/App.jsx
import { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts } from './api/supabase'
import { getUniqueOrgs } from './utils/aggregate'

import StatCard from './components/ui/StatCard'
import PlaceholderPanel from './components/ui/PlaceholderPanel'
import SectionHeader from './components/ui/SectionHeader'

import SignalVolumeChart from './components/charts/SignalVolumeChart'
import CommunityChart from './components/charts/CommunityChart'
import MatchRateChart from './components/charts/MatchRateChart'
import MatchByTypeChart from './components/charts/MatchByTypeChart'
import TopOrgsTable from './components/charts/TopOrgsTable'
import ConfidenceHistogram from './components/charts/ConfidenceHistogram'
import SeverityChart from './components/charts/SeverityChart'
import PostsVsSignalsChart from './components/charts/PostsVsSignalsChart'

function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {title && <p className="text-sm font-semibold text-gray-500 mb-4">{title}</p>}
      {children}
    </div>
  )
}

export default function App() {
  const [signals, setSignals] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading dashboard data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    )
  }

  const churnSignals = signals.filter((s) => s.signal_type === 'churn')
  const enrollUpsellSignals = signals.filter(
    (s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell'
  )
  const matchedSignals = signals.filter((s) => s.match_method != null)
  const matchRate =
    signals.length > 0 ? Math.round((matchedSignals.length / signals.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900">CSE Signal Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Community Signal Engine — Pipeline Performance</p>
      </div>

      <div className="px-8 py-6 space-y-8 max-w-screen-2xl mx-auto">

        {/* KPI Row */}
        <section>
          <SectionHeader title="Key Metrics" subtitle="All-time totals" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard title="Total Signals" value={signals.length} />
            <StatCard title="Posts Ingested" value={posts.length} />
            <StatCard
              title="Match Rate"
              value={`${matchRate}%`}
              subtitle={`${matchedSignals.length} of ${signals.length} matched`}
            />
            <StatCard
              title="Unique Pros Flagged"
              value={getUniqueOrgs(signals, ['churn'])}
              subtitle="Distinct orgs with churn signal"
            />
            <StatCard
              title="Unique Leads Routed"
              value={getUniqueOrgs(signals, ['enrollment', 'upsell'])}
              subtitle="Distinct orgs with enrollment/upsell"
            />
            <StatCard
              title="Churn Signals"
              value={churnSignals.length}
              subtitle={`${enrollUpsellSignals.length} enrollment/upsell`}
            />
          </div>
        </section>

        {/* Volume + Trend */}
        <section>
          <SectionHeader
            title="Signal Volume"
            subtitle="How many signals are being detected each week"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Signals by Week (churn / enrollment / upsell)">
              <SignalVolumeChart signals={signals} />
            </Panel>
            <Panel title="Posts Ingested vs Signals Generated (by date)">
              <PostsVsSignalsChart signals={signals} posts={posts} />
            </Panel>
          </div>
        </section>

        {/* Community breakdown */}
        <section>
          <SectionHeader
            title="Signal Sources"
            subtitle="Which Facebook communities produce the most signals"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Signals by Community (source)">
              <CommunityChart signals={signals} />
            </Panel>
            <Panel title="Top Orgs by Signal Count">
              <TopOrgsTable signals={signals} />
            </Panel>
          </div>
        </section>

        {/* Match rate */}
        <section>
          <SectionHeader
            title="Match Quality"
            subtitle="What % of signals were matched to a known HCP org"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Overall Match Rate">
              <MatchRateChart signals={signals} />
            </Panel>
            <Panel title="Matched vs Unmatched by Signal Type">
              <MatchByTypeChart signals={signals} />
            </Panel>
          </div>
        </section>

        {/* Signal quality */}
        <section>
          <SectionHeader
            title="Signal Quality"
            subtitle="Confidence scores and severity distribution"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Confidence Score Distribution">
              <ConfidenceHistogram signals={signals} />
            </Panel>
            <Panel title="Signals by Severity">
              <SeverityChart signals={signals} />
            </Panel>
          </div>
        </section>

        {/* Placeholder section — future data */}
        <section>
          <SectionHeader
            title="Action Metrics"
            subtitle="Available after Routing Agent and Slack 'Mark Actioned' button are built"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlaceholderPanel
              title="Avg Time to Route"
              description="Time between signal detection and Routing Agent processing. Available after Routing Agent ships (routed_at column)."
            />
            <PlaceholderPanel
              title="Avg Time to Action"
              description="Time between signal detection and CSM clicking 'Mark Actioned'. Available after Slack button ships (actioned_at column)."
            />
            <PlaceholderPanel
              title="% Signals Actioned"
              description="Share of signals where a CSM took action. Available after Slack button ships (actioned_at column)."
            />
          </div>
        </section>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run the dev server and verify the dashboard loads**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. You should see:
- Header with "CSE Signal Dashboard"
- KPI cards loading real numbers
- Charts populated with data
- Placeholder panels at the bottom
- No console errors

If you see "Error: …" on the page, check that `.env.local` has your real Supabase URL and anon key.

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: All tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/index.css
git commit -m "feat: wire full dashboard layout with all panels and live Supabase data"
```

---

## Task 13: Vercel Deploy Config + GitHub Push

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json for SPA routing**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Create GitHub repo and push**

Go to github.com/new and create a new repo named `cse-signal-dashboard` (private recommended for internal tooling).

Then:
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/cse-signal-dashboard.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Connect to Vercel**

1. Go to vercel.com → New Project
2. Import the `cse-signal-dashboard` GitHub repo
3. Vercel auto-detects Vite — no framework config needed
4. Before deploying, add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your public anon key
5. Click Deploy

- [ ] **Step 4: Verify production deploy**

Open the Vercel deploy URL. The dashboard should load with live data (same as local). If it shows a blank page, check the browser console for errors — likely an env var issue.

- [ ] **Step 5: Commit vercel.json**

```bash
git add vercel.json
git commit -m "feat: add Vercel SPA routing config"
git push
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Covered By |
|---|---|
| Retention signal queue view | Not in scope — spec says dashboard only, queues are Slack |
| Signal volume by type by week | SignalVolumeChart (Task 5) |
| Signal volume by community | CommunityChart (Task 6) |
| Match rate | MatchRateChart (Task 7) |
| Matched vs unmatched by type | MatchByTypeChart (Task 7) |
| Top orgs by signal count | TopOrgsTable (Task 8) |
| Confidence distribution | ConfidenceHistogram (Task 9) |
| Signals by severity | SeverityChart (Task 10) |
| Posts ingested vs signals generated | PostsVsSignalsChart (Task 11) |
| Unique Pros flagged | StatCard via getUniqueOrgs (Task 12) |
| Unique leads routed | StatCard via getUniqueOrgs (Task 12) |
| Time to route placeholder | PlaceholderPanel (Task 12) |
| Time to action placeholder | PlaceholderPanel (Task 12) |
| % signals actioned placeholder | PlaceholderPanel (Task 12) |
| Supabase REST API, no backend | fetchSignals/fetchPosts in api/supabase.js |
| Vercel deploy + env vars | Task 13 |

All requirements covered. No gaps.

### Placeholder Scan

No "TBD", "TODO", or vague steps found. Every step has real code.

### Type Consistency

- `groupByField`, `countByField`, `bucketConfidence`, `groupByWeek`, `getUniqueOrgs` defined in Task 3, imported by name in Tasks 5–8.
- `fetchSignals`, `fetchPosts` defined in Task 2, imported in App.jsx (Task 12).
- All chart components receive `signals` prop (array of signal rows) consistently.
- `PostsVsSignalsChart` receives both `signals` and `posts` — documented in both Task 11 and the App.jsx usage.
