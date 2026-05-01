# Phase 05: Claude AI Analysis - Research

**Researched:** 2026-05-01
**Domain:** Anthropic SDK, Vercel Serverless Functions, React data aggregation
**Confidence:** HIGH

## Summary

This phase adds an "AI Insights" tab to the existing Vite + React dashboard. When the tab is opened, a pre-aggregated summary of signal data is sent to a Vercel serverless function at `api/analyze.js`, which calls Claude Haiku 4.5 via `@anthropic-ai/sdk` and returns the analysis. The component displays a spinner while waiting and renders the full response at once when it arrives.

The technical domain is well-understood. All three pieces (Anthropic SDK, Vercel serverless functions, React fetch pattern) have clear, stable patterns that can be applied directly. The main gotchas are: (1) the existing `vercel.json` catch-all rewrite will swallow API requests unless API routes are listed first, (2) the `ANTHROPIC_API_KEY` must NOT have a `VITE_` prefix in the serverless function, and (3) local dev requires either the Vercel CLI or a Vite proxy config — the component cannot call `api/analyze.js` directly on `localhost` without one of these.

**Primary recommendation:** Use `@anthropic-ai/sdk` 0.92.0 in `api/analyze.js` with Web Handler syntax (`export default async function handler(req) { return new Response(...) }`), fix `vercel.json` to list the API route before the SPA fallback, and configure a Vite dev proxy so local dev routes `/api` requests to `http://localhost:3001` where `vercel dev` runs.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: 5th tab labeled "AI Insights", tab ID: `ai`
- D-02: New `AIInsightsTab.jsx` component; owns its own fetch/loading/response state — nothing new added to App.jsx state
- D-03: Auto-trigger analysis when tab becomes active; no button required
- D-04: Analyzes all signals (Churn + E&U combined)
- D-05: Pre-aggregated summary sent to Claude (not raw rows) — includes: total signal count, matched count, match rate %, high-severity count, signal count by type (churn vs E&U), top 3 sources by count, top 3 categories by count, current date
- D-06: Spinner / "Analyzing signals..." text while processing
- D-07: Full response rendered at once — no streaming
- D-08: Response as plain text / light markdown in a Panel component
- D-09: Local dev uses `ANTHROPIC_API_KEY` (or `VITE_ANTHROPIC_API_KEY`) from `.env.local`
- D-10: Production uses Vercel serverless at `api/analyze.js`; `ANTHROPIC_API_KEY` set in Vercel project settings; `vercel.json` needs API route entry
- D-11: Model: `claude-haiku-4-5-20251001`

### Claude's Discretion
- Exact wording/structure of the system prompt sent to Claude
- How to handle Claude API errors (show a friendly error message in the panel)
- Whether to cache the analysis result in component state so re-opening the tab doesn't re-run Claude every time
- Exact loading spinner style (reuse any existing loading pattern or simple text)

### Deferred Ideas (OUT OF SCOPE)
- Free-form Q&A chat (Phase 06)
- Urgent signal flagging (Phase 06)
- Weekly summary digest (Phase 06)
- Per-signal AI button (Phase 06)
- Streaming response (deferred)
- Model upgrade to Sonnet (deferred)
</user_constraints>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Signal data aggregation | Browser / Client | — | Signals already loaded in App.jsx; aggregation is a pure JS transform on existing state |
| API key security | API / Backend (Vercel serverless) | — | Keys must never appear in frontend bundles; serverless function is the only safe place |
| Claude API call | API / Backend (Vercel serverless) | — | `@anthropic-ai/sdk` is a Node.js library; can't run in the browser |
| Loading / error state | Browser / Client | — | Local component state in `AIInsightsTab.jsx` |
| Response rendering | Browser / Client | — | Plain text / light markdown rendered in existing Panel component |
| Request routing | CDN / Vercel Edge | — | `vercel.json` routes `/api/analyze` to the serverless function before the SPA fallback catches it |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.92.0 | Call Claude API from Node.js | Official Anthropic client; handles auth, retries, typed responses |
| Node.js (Vercel runtime) | 25.x (host) | Serverless function runtime | Default Vercel runtime for `api/*.js` files |

[VERIFIED: npm registry — `npm view @anthropic-ai/sdk version` returned `0.92.0` on 2026-05-01]
[VERIFIED: platform.claude.com/docs — model ID `claude-haiku-4-5-20251001` confirmed as current Claude API ID for Haiku 4.5]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | All UI components and utilities are already in the project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` | Raw `fetch` to Anthropic REST API | SDK adds typed responses, auto-retry, and simpler auth; no reason to hand-roll for this use case |
| Vercel serverless | Vite proxy calling Claude directly from browser | Exposes API key in frontend bundle — hard no per project security constraint |

**Installation (serverless function only):**
```bash
npm install @anthropic-ai/sdk
```

Note: `@anthropic-ai/sdk` is a server-side dependency. It runs inside `api/analyze.js` on Vercel's Node.js runtime and is bundled by Vercel at deploy time. It does NOT need to run in the Vite build.

---

## Architecture Patterns

### System Architecture Diagram

```
User opens "AI Insights" tab
        |
        v
AIInsightsTab.jsx (Browser)
  - builds aggregated summary object from signals prop
  - sets loading = true
  - POST /api/analyze  { summary: {...} }
        |
        v
Vercel Routes request:
  vercel.json: "/api/:path*" -> serverless function (BEFORE SPA fallback)
        |
        v
api/analyze.js (Vercel Node.js serverless)
  - reads ANTHROPIC_API_KEY from process.env
  - calls client.messages.create(...)
  - returns { analysis: "..." } JSON
        |
        v
AIInsightsTab.jsx (Browser)
  - sets loading = false
  - renders response text in <Panel>
```

### Recommended Project Structure
```
api/
  analyze.js          # NEW — Vercel serverless function
src/
  components/ui/
    AIInsightsTab.jsx # NEW — 5th tab component
  utils/
    aggregate.js      # EXISTING — countByField used for top sources/categories
vercel.json           # MODIFY — add api route before SPA fallback
.env.example          # MODIFY — add ANTHROPIC_API_KEY entry
```

### Pattern 1: Vercel Serverless Function (Web Handler syntax)

**What:** A file in `api/` at the project root. Vercel automatically deploys it as a serverless function. Uses Web Handler syntax (Web standard `Request`/`Response`) — this is the current Vercel standard as of 2026.

**When to use:** Any time you need server-side logic (API keys, calls to third-party APIs) in a Vite SPA project.

```javascript
// api/analyze.js
// Source: [VERIFIED: vercel.com/docs/functions/functions-api-reference]

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  // process.env.ANTHROPIC_API_KEY — set in Vercel project settings (production)
  // or .env.local (local dev via vercel dev)
  // DO NOT prefix with VITE_ — that would embed it in the browser bundle
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req) {
  // Handle CORS preflight
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

    const analysis = message.content[0].text

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

### Pattern 2: AIInsightsTab Component

**What:** Self-contained React component that owns its own loading/error/response state. Fetches on mount (when tab becomes active) via `useEffect`.

```javascript
// src/components/ui/AIInsightsTab.jsx
// Source: [ASSUMED — React useEffect + fetch pattern; no external docs needed]

import { useEffect, useState } from 'react'
import { countByField } from '../../utils/aggregate'

// Panel is defined in App.jsx; either import a shared version or inline it
function Panel({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 20 }}>
      {title && <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', marginBottom: 16 }}>{title}</p>}
      {children}
    </div>
  )
}

export default function AIInsightsTab({ signals }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Auto-run on mount (D-03). Optional: cache by skipping if analysis already set.
    runAnalysis()
  }, []) // runs once when tab first mounts

  async function runAnalysis() {
    setLoading(true)
    setError(null)

    try {
      const summary = buildSummary(signals)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div>
      <Panel title="AI Signal Analysis">
        {loading && (
          <p style={{ color: '#6B7487', fontSize: 14 }}>Analyzing signals…</p>
        )}
        {error && (
          <p style={{ color: '#D81860', fontSize: 14 }}>{error}</p>
        )}
        {analysis && (
          <p style={{ fontSize: 14, color: '#15181D', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {analysis}
          </p>
        )}
      </Panel>
    </div>
  )
}

// Builds the pre-aggregated summary object (D-05) from the raw signals array.
function buildSummary(signals) {
  const churn = signals.filter((s) => s.signal_type === 'churn')
  const enrollment = signals.filter((s) => s.signal_type === 'enrollment')
  const matched = signals.filter((s) => s.match_method != null && s.match_method !== 'not_found')
  const highSeverity = signals.filter((s) => s.severity === 'high')

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

### Pattern 3: vercel.json Fix

**What:** The current `vercel.json` has a catch-all SPA rewrite. The API route must be listed first, or Vercel will route `/api/analyze` requests to `index.html` instead.

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

[VERIFIED: vercel.com community + Vercel rewrites docs — API routes must precede SPA catch-all]

### Pattern 4: App.jsx Integration

```javascript
// In TABS array — add 5th entry
const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
  { id: 'browse', label: 'Browse' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'ai', label: 'AI Insights' },  // NEW
]

// New boolean
const isAI = activeTab === 'ai'

// In the content block — add after isPipeline block
{isAI && (
  <div style={{ marginBottom: 32 }}>
    <AIInsightsTab signals={signals} />
  </div>
)}

// FilterPills guard — add isAI to the condition so pills don't show on AI tab
{!isBrowse && !isPipeline && !isAI && (
  <FilterPills ... />
)}
```

### Anti-Patterns to Avoid

- **VITE_ prefix on ANTHROPIC_API_KEY:** `VITE_ANTHROPIC_API_KEY` causes Vite to embed the value in the browser bundle, exposing it publicly. The serverless function reads `process.env.ANTHROPIC_API_KEY` (no VITE_ prefix). [VERIFIED: Vercel docs + Vite docs]
- **Calling `api/analyze.js` directly from browser in local dev with plain `npm run dev`:** Vite dev server does not serve `api/` functions. Use Vite proxy + `vercel dev`, or accept that local dev needs Vercel CLI. See Local Dev section below.
- **Sending raw signal rows to Claude:** Each signal row has 37 columns; sending thousands of raw rows would exceed token limits and cost far more than the pre-aggregated summary approach (D-05).
- **Mutating the summary object:** Use spread/immutable patterns consistent with the rest of the codebase when building the summary.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client for Anthropic | Custom fetch wrapper | `@anthropic-ai/sdk` | SDK handles auth headers, retry on 529 (overload), typed response, error classes |
| Markdown rendering | Custom HTML parser | `whiteSpace: 'pre-wrap'` + `<br>` or simple string split | Claude's output for this use case is light enough that pre-wrap handles it; full markdown renderer is overkill for Phase 05 |
| Rate limit retry | Sleep loop | SDK auto-retries | `@anthropic-ai/sdk` retries 429/529 with exponential backoff by default |

---

## Local Development Strategy

This is the most operationally complex part of Phase 05.

**The problem:** `npm run dev` starts the Vite dev server. It does NOT run `api/analyze.js`. So `fetch('/api/analyze')` returns 404 during local dev.

**Three options — in order of recommendation:**

### Option A: Vite proxy + vercel dev (recommended)
Run two processes: `vercel dev` (handles `api/`) and `vite` (handles the frontend). Add a Vite proxy so `/api` requests from Vite are forwarded to `vercel dev`:

```javascript
// vite.config.js addition
server: {
  proxy: {
    '/api': 'http://localhost:3000', // vercel dev default port
  },
},
```

Then in two terminals:
```
terminal 1: vercel dev        # runs on :3000
terminal 2: npm run dev       # vite on :5173, proxies /api to :3000
```

Vercel CLI reads `.env.local` for `ANTHROPIC_API_KEY` automatically.

### Option B: Skip local dev, test on Vercel preview
Push to a branch, let Vercel auto-deploy a preview URL. Set `ANTHROPIC_API_KEY` in Vercel project settings. Fast for a simple feature like this.

### Option C: VITE_ env var as a dev-only escape hatch
For pure local dev convenience, read `VITE_ANTHROPIC_API_KEY` in the component and call the Anthropic API directly from the browser using a minimal inline fetch. This bypasses the serverless function entirely. **Only acceptable in dev — never in production.** The project constraint (D-09) hints at this: "Local dev reads `VITE_ANTHROPIC_API_KEY` (or `ANTHROPIC_API_KEY`) from `.env.local`."

Given the project constraint, **Option B is the path of least resistance** for this phase. Option A is more correct but adds Vercel CLI as a new requirement.

[ASSUMED — Option B vs A recommendation; Patrick should confirm preferred local dev workflow]

---

## Common Pitfalls

### Pitfall 1: vercel.json catch-all swallows API requests
**What goes wrong:** The current `vercel.json` has `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`. This matches `/api/analyze` and serves `index.html` instead of the function, returning a 200 with HTML content when JSON is expected.
**Why it happens:** Vercel processes rewrites in order; the catch-all matches before Vercel can route to the function.
**How to avoid:** Add the API route rewrite BEFORE the SPA fallback in `vercel.json`.
**Warning signs:** `fetch('/api/analyze')` returns HTML instead of JSON; `res.ok` is true but `res.json()` throws a parse error.

### Pitfall 2: VITE_ prefix exposes API key
**What goes wrong:** If `VITE_ANTHROPIC_API_KEY` is used and the serverless function reads it, the value is embedded in the built JS bundle and visible to anyone who views source.
**Why it happens:** Vite replaces all `VITE_*` env vars at build time — they become literal strings in the output.
**How to avoid:** Serverless function reads `process.env.ANTHROPIC_API_KEY` (no prefix). Frontend code never touches this variable.
**Warning signs:** `grep -r "ANTHROPIC" dist/` shows the API key value in built output.

### Pitfall 3: Streaming response mishandled
**What goes wrong:** `@anthropic-ai/sdk` defaults to non-streaming, but if `stream: true` is accidentally added, the response is an async iterator, not a message object — `message.content[0].text` would be undefined.
**Why it happens:** Copy-paste from streaming examples.
**How to avoid:** Don't add `stream: true`. The non-streaming call returns a `Message` object synchronously (after awaiting).
**Warning signs:** `message.content` is undefined or the response object is an async generator.

### Pitfall 4: `useEffect` re-runs on every re-render
**What goes wrong:** If the dependency array is wrong or omitted, Claude is called on every render cycle, not just on tab open.
**Why it happens:** Missing or incorrect `useEffect` dependency array.
**How to avoid:** Use `useEffect(() => { runAnalysis() }, [])` — empty array means "run once on mount". Optionally gate with `if (!analysis && !loading)` to prevent re-running when user switches away and back.
**Warning signs:** Network tab shows repeated calls to `/api/analyze`.

### Pitfall 5: `req.json()` fails if Content-Type header is missing
**What goes wrong:** The serverless function's `req.json()` throws if the request body has no `Content-Type: application/json` header.
**Why it happens:** `fetch()` doesn't add `Content-Type` automatically for JSON bodies.
**How to avoid:** Always include `headers: { 'Content-Type': 'application/json' }` in the `fetch()` call from the component.

### Pitfall 6: Claude response has no content
**What goes wrong:** `message.content[0].text` throws "Cannot read property 'text' of undefined" if content array is empty.
**Why it happens:** Rare but possible if Claude returned a stop reason of `max_tokens` with no output, or if the response was filtered.
**How to avoid:** Guard: `const text = message.content?.[0]?.text ?? 'No analysis returned.'`

---

## Code Examples

### Anthropic SDK — verified non-streaming call
```javascript
// Source: [VERIFIED: context7.com/anthropics/anthropic-sdk-typescript]
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const message = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',  // verified model ID from platform.claude.com/docs
  max_tokens: 1024,
  system: 'You are a helpful analyst.',
  messages: [
    { role: 'user', content: 'Analyze this data: ...' },
  ],
})

// Response structure (verified):
// message.content = [{ type: 'text', text: '...' }]
// message.usage = { input_tokens: N, output_tokens: N }
const text = message.content[0].text
```

### Vercel serverless — Web Handler format
```javascript
// Source: [VERIFIED: vercel.com/docs/functions/functions-api-reference]
// "Other Frameworks" (non-Next.js) use Web Handler syntax
export default async function handler(req) {
  const body = await req.json()
  return new Response(JSON.stringify({ result: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## Environment Variable Reference

| Variable | Where it lives | Who reads it | Notes |
|----------|---------------|--------------|-------|
| `ANTHROPIC_API_KEY` | Vercel project settings (production), `.env.local` (local dev with `vercel dev`) | `api/analyze.js` via `process.env` | NEVER prefix with `VITE_` |
| `VITE_SUPABASE_URL` | `.env.local`, Vercel project settings | Vite frontend build | Already exists |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel project settings | Vite frontend build | Already exists |

**.env.example** additions:
```
# Anthropic API key — server-side only (never use VITE_ prefix)
# Set in Vercel project settings for production
# Set in .env.local for local dev (only readable by api/ functions via vercel dev)
ANTHROPIC_API_KEY=your-key-here
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel Node.js handler (`module.exports = (req, res) => {}`) | Web Handler (`export default async function(req) { return new Response() }`) | ~2024 | New format uses Web standard Request/Response — simpler, no `res.send()` patterns |
| `claude-haiku-3-5` | `claude-haiku-4-5-20251001` | Oct 2025 | Haiku 4.5 is the current fast/cheap model; prior Haiku 3.5 is legacy |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Option B (test on Vercel preview, skip `vercel dev`) is the path of least resistance for local dev | Local Development Strategy | If Patrick wants true local dev, Option A (Vite proxy + vercel dev) requires installing Vercel CLI and adding proxy config |
| A2 | System prompt wording in the code example is appropriate for the CSE team's needs | Pattern 1 code example | Claude may produce output that's too verbose, too brief, or misses what the team cares about — prompt may need tuning |
| A3 | Caching analysis result in component state (skip re-run if already loaded) is desirable | Pattern 2 code example | If Patrick wants fresh analysis every time the tab is opened, the `if (!analysis && !loading)` guard should be removed |

---

## Open Questions

1. **Local dev workflow preference**
   - What we know: Local dev cannot use `npm run dev` alone to test `api/analyze.js`
   - What's unclear: Does Patrick want to set up `vercel dev` locally, or test AI features on Vercel preview deployments only?
   - Recommendation: Default plan to Option B (test on preview). Note Option A in the plan as an upgrade if needed.

2. **Panel component sharing**
   - What we know: `Panel` is defined inline in `App.jsx`, not in a shared file
   - What's unclear: Should `AIInsightsTab.jsx` copy the Panel definition locally, or should Panel be extracted to a shared component?
   - Recommendation: Copy locally for now (consistent with how `PipelineTab.jsx` likely handles it). Extraction is Phase 06+ scope.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vercel serverless runtime | ✓ | 25.8.1 (local) | — |
| @anthropic-ai/sdk | api/analyze.js | ✗ (not installed yet) | 0.92.0 (latest) | None — must install |
| Vercel CLI | Local dev Option A | ✗ | — | Use Option B (preview deploy) |
| ANTHROPIC_API_KEY | api/analyze.js | Not verified | — | Cannot run without it; must be set in Vercel project settings |

**Missing dependencies with no fallback:**
- `@anthropic-ai/sdk` — must be installed (`npm install @anthropic-ai/sdk`) before api/analyze.js works
- `ANTHROPIC_API_KEY` environment variable — must be set in Vercel project settings before production works

**Missing dependencies with fallback:**
- Vercel CLI — not required if testing on Vercel preview deployments (Option B)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vite.config.js` (test block with jsdom + test-setup.js) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-05 | `buildSummary(signals)` produces correct aggregated object | unit | `npm test -- AIInsightsTab` | No — Wave 0 gap |
| D-07 | Component shows loading state, then renders analysis text | unit | `npm test -- AIInsightsTab` | No — Wave 0 gap |
| D-10 | `api/analyze.js` returns JSON with `analysis` field | manual (Vercel preview) | Manual browser test | N/A |

### Wave 0 Gaps
- [ ] `src/components/ui/AIInsightsTab.test.jsx` — covers D-05 (buildSummary), D-07 (loading state render)
- [ ] No new fixtures needed — existing `signals` mock arrays from prior tests can be reused

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes (low risk) | Validate `summary` object shape in `api/analyze.js` before sending to Claude |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure in frontend bundle | Information Disclosure | Never use `VITE_` prefix; key only in serverless function via `process.env` |
| Prompt injection via summary data | Tampering | Summary is built from numeric aggregations and short strings — low injection risk; no user-controlled free text is included |
| Excessive token consumption | Denial of Service | Pre-aggregated summary is small (~200 tokens input); `max_tokens: 1024` caps output cost |

---

## Sources

### Primary (HIGH confidence)
- `platform.claude.com/docs/en/about-claude/models/overview` — verified current model IDs including `claude-haiku-4-5-20251001`
- `context7.com/anthropics/anthropic-sdk-typescript` — verified `messages.create()` API, response shape, non-streaming pattern
- `vercel.com/docs/functions/functions-api-reference` — verified Web Handler syntax for non-Next.js frameworks
- npm registry (`npm view @anthropic-ai/sdk version`) — verified SDK version 0.92.0

### Secondary (MEDIUM confidence)
- `vercel.com/docs/environment-variables` — env var handling, VITE_ prefix behavior
- `vercel.com` community discussion on SPA + API rewrite ordering

### Tertiary (LOW confidence)
- Local dev Option A (Vite proxy + vercel dev) details — sourced from community discussions, not official Vercel docs for this exact configuration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK version verified from registry, model ID verified from official docs
- Architecture: HIGH — Vercel function pattern verified from official docs; React fetch pattern is standard
- Pitfalls: HIGH — vercel.json rewrite conflict is documented in multiple Vercel community threads and verified against official rewrites docs

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable domain; Anthropic model IDs occasionally change, verify before using)
