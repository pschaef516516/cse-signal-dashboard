# Phase 05: Claude AI Analysis - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 5 (2 new, 3 modified)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/ui/AIInsightsTab.jsx` | component | request-response | `src/components/ui/BrowseTab.jsx` | role-match (async fetch + loading/error state) |
| `api/analyze.js` | service | request-response | none in codebase — use RESEARCH.md Pattern 1 | no analog |
| `src/App.jsx` | config/orchestrator | — | `src/App.jsx` itself (TABS array + content block) | exact (modify in-place) |
| `vercel.json` | config | — | `vercel.json` itself (rewrite rules) | exact (modify in-place) |
| `.env.example` | config | — | `.env.example` itself | exact (append) |

---

## Pattern Assignments

### `src/components/ui/AIInsightsTab.jsx` (component, request-response)

**Analog:** `src/components/ui/BrowseTab.jsx` (async fetch on mount, loading/error state pattern) and `src/components/ui/PipelineTab.jsx` (Panel usage, data computation from props)

---

#### Imports pattern

Copy from `BrowseTab.jsx` lines 1-6 and `PipelineTab.jsx` lines 1-3. New file only needs:

```javascript
import { useEffect, useState } from 'react'
import { countByField } from '../../utils/aggregate'
```

`countByField` is the only aggregate utility needed for top-3 sources and categories (see aggregate.js lines 9-14).

---

#### Panel component pattern

**Source:** `src/components/ui/PipelineTab.jsx` lines 5-14 (identical to App.jsx lines 30-39)

Panel is defined locally in each tab component — do NOT import from App.jsx (it is not exported). Copy the definition verbatim:

```javascript
// PipelineTab.jsx lines 5-14 — copy this definition locally into AIInsightsTab.jsx
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

---

#### Loading state pattern

**Source:** `src/components/ui/BrowseTab.jsx` line 338

BrowseTab renders loading as an inline span inside the filter panel:

```javascript
// BrowseTab.jsx line 338
{loading && <span style={{ fontSize: 12, color: '#6B7487' }}>Loading…</span>}
{error && <span style={{ fontSize: 12, color: '#D81860' }}>Error: {error}</span>}
```

For AIInsightsTab, the same color tokens apply but render inside the Panel instead of a filter bar. Use `fontSize: 14` to match the prose weight of the analysis response:

```javascript
// Apply inside <Panel title="AI Signal Analysis">
{loading && (
  <p style={{ color: '#6B7487', fontSize: 14, margin: 0 }}>Analyzing signals…</p>
)}
{error && (
  <p style={{ color: '#D81860', fontSize: 14, margin: 0 }}>{error}</p>
)}
```

---

#### Async fetch on mount pattern (useEffect)

**Source:** `src/components/ui/BrowseTab.jsx` lines 169-233

BrowseTab uses `useEffect` with a cancellation flag for async fetches. AIInsightsTab needs the same structure but simpler (no cancellation needed for a one-shot POST):

```javascript
// BrowseTab.jsx lines 169-233 — simplified version for AIInsightsTab
const [loading, setLoading] = useState(false)
const [analysis, setAnalysis] = useState(null)
const [error, setError] = useState(null)

useEffect(() => {
  // Runs once on mount (when tab first becomes active).
  // Empty dependency array = "run once". See RESEARCH.md Pitfall 4.
  runAnalysis()
}, [])

async function runAnalysis() {
  setLoading(true)
  setError(null)
  try {
    const summary = buildSummary(signals)
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // required — see RESEARCH.md Pitfall 5
      body: JSON.stringify({ summary }),
    })
    if (!res.ok) throw new Error(`Server error: ${res.status}`)
    const data = await res.json()
    setAnalysis(data.analysis)
  } catch (err) {
    setError('Could not load analysis. Please refresh the tab to try again.')
  } finally {
    setLoading(false)
  }
}
```

---

#### Empty / no-data state pattern

**Source:** `src/components/ui/BrowseTab.jsx` lines 377-379

```javascript
// BrowseTab.jsx lines 377-379
{displayedSignals.length === 0 ? (
  <p style={emptyStateStyle}>No signals found for this period</p>
) : ( ... )}
```

`emptyStateStyle` from BrowseTab.jsx lines 118-124:

```javascript
const emptyStateStyle = {
  textAlign: 'center',
  padding: '32px 0',
  fontSize: 14,
  color: '#6B7487',
  margin: 0,
}
```

AIInsightsTab does not need this for the analysis panel, but it should guard the initial render before loading starts:

```javascript
{!loading && !error && !analysis && (
  <p style={{ color: '#6B7487', fontSize: 14, margin: 0 }}>No analysis yet.</p>
)}
```

---

#### Data aggregation pattern (`buildSummary`)

**Source:** `src/utils/aggregate.js` lines 9-14 (`countByField`) and App.jsx lines 163-179 (match rate and severity derivations)

`countByField` returns `[{ name, count }, ...]` sorted descending. Use `.slice(0, 3)` for top-3.

App.jsx lines 163-179 show the exact filter expressions for matched signals and severity:

```javascript
// App.jsx lines 163-171 — copy these derivation patterns for buildSummary
const matchedSignals = tabSignals.filter(
  (s) => s.match_method != null && s.match_method !== 'not_found'
)
const matchRate = tabSignals.length > 0
  ? Math.round((matchedSignals.length / tabSignals.length) * 100)
  : 0

const highSeverity = tabSignals.filter((s) => s.severity === 'high').length
```

Signal type filter expressions from App.jsx lines 139-141:

```javascript
// App.jsx lines 139-141
const churnSignals = signals.filter((s) => s.signal_type === 'churn')
const enrollmentSignals = signals.filter((s) => s.signal_type === 'enrollment')
```

Full `buildSummary` function (immutable, no mutation — per CLAUDE.md):

```javascript
// Place at bottom of AIInsightsTab.jsx as a module-level helper (not inside the component)
function buildSummary(signals) {
  const matched = signals.filter((s) => s.match_method != null && s.match_method !== 'not_found')
  const highSeverity = signals.filter((s) => s.severity === 'high')
  const churn = signals.filter((s) => s.signal_type === 'churn')
  const enrollment = signals.filter((s) => s.signal_type === 'enrollment')
  const topSources = countByField(signals, 'source').slice(0, 3)
  const topCategories = countByField(signals, 'category').slice(0, 3)

  return {
    date: new Date().toISOString().split('T')[0],
    totalSignals: signals.length,
    matchedCount: matched.length,
    matchRatePct: signals.length > 0 ? Math.round((matched.length / signals.length) * 100) : 0,
    highSeverityCount: highSeverity.length,
    churnSignalCount: churn.length,
    enrollmentSignalCount: enrollment.length,
    top3Sources: topSources,
    top3Categories: topCategories,
  }
}
```

---

#### Response rendering pattern

**Source:** App.jsx lines 342-353 (large text value display inside Panel)

App.jsx renders large stat values and plain text inside Panel children with inline font styles. For the analysis text, use `whiteSpace: 'pre-wrap'` so Claude's newlines and bullet points render correctly without a markdown library:

```javascript
// Render analysis response inside Panel — no markdown lib needed (RESEARCH.md "Don't Hand-Roll")
{analysis && (
  <p style={{ fontSize: 14, color: '#15181D', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
    {analysis}
  </p>
)}
```

Color tokens: `#15181D` (body text), `#6B7487` (muted/loading), `#D81860` (error). Source: CONTEXT.md design tokens.

---

### `api/analyze.js` (service, request-response)

**Analog:** No existing analog in the codebase. There are no files in `api/` yet. Use RESEARCH.md Pattern 1 (Vercel Web Handler syntax) directly.

**Key constraints from RESEARCH.md:**
- Use Web Handler syntax (`export default async function handler(req)`), NOT `module.exports = (req, res) => {}` — the old Node.js format is deprecated on Vercel as of 2024
- `process.env.ANTHROPIC_API_KEY` — no `VITE_` prefix (RESEARCH.md Pitfall 2)
- Always guard `message.content?.[0]?.text` (RESEARCH.md Pitfall 6)
- Return CORS headers on all responses including errors (needed for local dev with Vite proxy)

```javascript
// api/analyze.js — full pattern from RESEARCH.md Pattern 1
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { summary } = await req.json()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a CSE (Customer Success Engineering) analyst at HousecallPro.
Analyze the signal pipeline data and provide a concise written summary for the CSE team.
Focus on: overall pipeline health, match rate quality, high-severity signals, and the top sources and categories.
Write in plain English with short paragraphs or bullet points. Be direct and actionable.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this signal pipeline summary as of ${summary.date}:\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    })

    const analysis = message.content?.[0]?.text ?? 'No analysis returned.'

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return new Response(
      JSON.stringify({ error: 'Analysis failed. Please try again.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
```

---

### `src/App.jsx` (modify — TABS array + content block + FilterPills guard)

**Analog:** App.jsx itself. The exact three locations to modify are documented here.

---

#### Location 1: TABS array (App.jsx lines 23-28)

Current state:

```javascript
// App.jsx lines 23-28
const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
  { id: 'browse', label: 'Browse' },
  { id: 'pipeline', label: 'Pipeline' },
]
```

Append one entry — match the existing object shape exactly (`id`, `label`):

```javascript
const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
  { id: 'browse', label: 'Browse' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'ai', label: 'AI Insights' },  // NEW — D-01
]
```

---

#### Location 2: Boolean flags (App.jsx lines 131-134)

Current state:

```javascript
// App.jsx lines 131-134
const isChurn = activeTab === 'churn'
const isBrowse = activeTab === 'browse'
const isPipeline = activeTab === 'pipeline'
const activeTimeFilter = isChurn ? churnTimeFilter : enrollmentTimeFilter
```

Add `isAI` after `isPipeline` — same pattern:

```javascript
const isChurn = activeTab === 'churn'
const isBrowse = activeTab === 'browse'
const isPipeline = activeTab === 'pipeline'
const isAI = activeTab === 'ai'  // NEW — D-02
const activeTimeFilter = isChurn ? churnTimeFilter : enrollmentTimeFilter
```

---

#### Location 3: Content block (App.jsx lines 443-447)

Current state — `isPipeline` block is the last conditional block:

```javascript
// App.jsx lines 443-447
{isPipeline && (
  <div style={{ marginBottom: 32 }}>
    <PipelineTab signals={signals} posts={posts} />
  </div>
)}
```

Add `isAI` block immediately after, copying the `marginBottom: 32` wrapper pattern:

```javascript
{isPipeline && (
  <div style={{ marginBottom: 32 }}>
    <PipelineTab signals={signals} posts={posts} />
  </div>
)}

{isAI && (
  <div style={{ marginBottom: 32 }}>
    <AIInsightsTab signals={signals} />
  </div>
)}
```

---

#### Location 4: FilterPills guard (App.jsx line 256)

Current state:

```javascript
// App.jsx line 256
{!isBrowse && !isPipeline && (
  <FilterPills ... />
)}
```

Add `!isAI` so pills do not appear on the AI tab:

```javascript
{!isBrowse && !isPipeline && !isAI && (
  <FilterPills ... />
)}
```

---

#### Location 5: Main content guard (App.jsx line 272)

Current state:

```javascript
// App.jsx line 272
{!isBrowse && !isPipeline && (
  <>
    {/* Key Metrics, charts, etc. */}
  </>
)}
```

Add `!isAI` so the churn/enrollment charts do not render on the AI tab:

```javascript
{!isBrowse && !isPipeline && !isAI && (
  <>
    {/* Key Metrics, charts, etc. */}
  </>
)}
```

---

#### Location 6: Import (App.jsx lines 1-12)

Add the AIInsightsTab import after PipelineTab:

```javascript
// App.jsx lines 11-12
import BrowseTab from './components/ui/BrowseTab'
import PipelineTab from './components/ui/PipelineTab'
import AIInsightsTab from './components/ui/AIInsightsTab'  // NEW
```

---

### `vercel.json` (modify — add API route before SPA fallback)

**Analog:** `vercel.json` itself. Current state (line 2):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The catch-all rewrite must NOT be the only rule — it will swallow `/api/analyze` requests (RESEARCH.md Pitfall 1). Add the API route first:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Order matters — Vercel processes rewrites top-to-bottom. The API route must be first.

---

### `.env.example` (modify — append ANTHROPIC_API_KEY)

**Analog:** `.env.example` itself. Current state (lines 1-2):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Append below the existing two lines:

```
# Anthropic API key — server-side only, used by api/analyze.js
# NEVER use the VITE_ prefix — that would embed the key in the browser bundle
# Set in Vercel project settings for production
# Set in .env.local for local dev (only readable by api/ functions via vercel dev)
ANTHROPIC_API_KEY=your-anthropic-key-here
```

---

## Shared Patterns

### Inline styles only — no Tailwind

**Source:** All existing component files (`BrowseTab.jsx`, `PipelineTab.jsx`, `PlaceholderPanel.jsx`, `App.jsx`)
**Apply to:** `AIInsightsTab.jsx`

Every style in this codebase uses the `style={{ ... }}` prop directly. No CSS files, no Tailwind class names. The `tailwindcss` plugin in `vite.config.js` is present but all existing components ignore it.

Design tokens used across all components:

```javascript
// Use these tokens everywhere — from CONTEXT.md canonical refs
const TOKEN = {
  bg: '#FAFBFF',        // page background
  white: '#FFFFFF',     // panel background
  border: '#E1E6F2',    // all borders
  text: '#15181D',      // body text
  muted: '#6B7487',     // labels, subtitles, loading text
  primary: '#0057FF',   // active states, links
  danger: '#D81860',    // errors, churn
  success: '#00A344',   // positive indicators
  radius: 12,           // panel border-radius
}
```

---

### useState only (no external state library)

**Source:** `src/App.jsx` lines 57-74, `BrowseTab.jsx` lines 130-153
**Apply to:** `AIInsightsTab.jsx`

All state is managed with `useState`. No Redux, Zustand, or Context. Component-local state only. `AIInsightsTab.jsx` owns its own `loading`, `analysis`, and `error` state — nothing new goes into App.jsx state (D-02).

---

### Error handling pattern

**Source:** `src/App.jsx` lines 76-89 (data fetch try/catch) and `BrowseTab.jsx` lines 172-228

```javascript
// App.jsx lines 76-89 — the catch block sets error state, finally clears loading
try {
  const [signalsData, postsData] = await Promise.all([fetchSignals(), fetchPosts()])
  setSignals(signalsData)
  setPosts(postsData)
} catch (err) {
  setError(err.message)
} finally {
  setLoading(false)
}
```

AIInsightsTab follows the same shape: `setLoading(true)` before the try, `setError(...)` in catch, `setLoading(false)` in finally.

---

### Immutable patterns

**Source:** `src/utils/aggregate.js` lines 1-7, 32-51 (spread operator, no mutation)
**Apply to:** `buildSummary` function in `AIInsightsTab.jsx`

`aggregate.js` uses spread (`{ ...acc, [key]: ... }`) and returns new objects. `buildSummary` must do the same — never mutate the `signals` array or any derived object.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `api/analyze.js` | service | request-response | No `api/` directory exists yet; no serverless functions anywhere in the project |

Planner should use RESEARCH.md Pattern 1 (Vercel Web Handler syntax) and the verified Anthropic SDK call pattern from RESEARCH.md "Code Examples" section.

---

## Metadata

**Analog search scope:** `src/components/ui/`, `src/utils/`, `src/App.jsx`, `vercel.json`, `.env.example`, `vite.config.js`
**Files scanned:** 7 (App.jsx, PipelineTab.jsx, BrowseTab.jsx, PlaceholderPanel.jsx, aggregate.js, vercel.json, .env.example)
**Pattern extraction date:** 2026-05-01
