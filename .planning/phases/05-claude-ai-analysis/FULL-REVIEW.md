---
phase: 05-claude-ai-analysis
reviewed: 2026-05-01T00:00:00Z
depth: deep
files_reviewed: 31
files_reviewed_list:
  - src/App.jsx
  - src/api/supabase.js
  - src/components/charts/CategoryBreakdownChart.jsx
  - src/components/charts/CommunityChart.jsx
  - src/components/charts/ConfidenceHistogram.jsx
  - src/components/charts/EUCommunityChart.jsx
  - src/components/charts/EnrollmentUpsellSplitChart.jsx
  - src/components/charts/MatchByTypeChart.jsx
  - src/components/charts/MatchRateChart.jsx
  - src/components/charts/PostsVsSignalsChart.jsx
  - src/components/charts/SeverityChart.jsx
  - src/components/charts/SignalVolumeChart.jsx
  - src/components/charts/TopOrgsTable.jsx
  - src/components/ui/AIInsightsTab.jsx
  - src/components/ui/BrowseFilterPill.jsx
  - src/components/ui/BrowseTab.jsx
  - src/components/ui/FilterPills.jsx
  - src/components/ui/PipelineTab.jsx
  - src/components/ui/PlaceholderPanel.jsx
  - src/components/ui/SectionHeader.jsx
  - src/components/ui/SignalCard.jsx
  - src/components/ui/SignalDetail.jsx
  - src/components/ui/SignalDrawer.jsx
  - src/components/ui/SignalModal.jsx
  - src/components/ui/StatCard.jsx
  - src/config/sourceMappings.js
  - src/main.jsx
  - src/utils/aggregate.js
  - src/utils/dateRanges.js
  - src/utils/format.js
  - api/analyze.js
findings:
  critical: 2
  warning: 7
  info: 8
  total: 17
status: issues_found
---

# Full Codebase Review: CSE Signal Dashboard

**Reviewed:** 2026-05-01
**Depth:** deep
**Files Reviewed:** 31
**Status:** issues_found

## Summary

This is an internal React + Vite dashboard that reads Supabase data, renders Recharts visualizations, and calls the Anthropic API via a Vercel serverless function. The codebase is generally well-structured and thoughtfully commented. The developer has clearly put effort into avoiding known pitfalls (the RESEARCH.md notes are followed throughout).

Two critical issues were found:

1. The `VITE_ANTHROPIC_API_KEY` is exposed in the browser bundle whenever `import.meta.env.DEV` is true. Since the key lives in `.env.local` and Vite bakes any `VITE_*` variable into the JS bundle at build time, the key is present in the production build if anyone mistakenly runs `vite build` with `.env.local` present, or if `VITE_ANTHROPIC_API_KEY` is ever set in Vercel environment variables.

2. The `/api/analyze` serverless endpoint accepts a user-supplied `system` prompt with no validation, meaning any caller can override the system prompt with arbitrary instructions (prompt injection via the API surface).

The remaining findings are bugs and quality issues, none catastrophic, but several affect correctness of data the dashboard presents.

---

## Critical Issues

### CR-01: VITE_ANTHROPIC_API_KEY embeds the Anthropic key in the browser bundle

**File:** `src/components/ui/AIInsightsTab.jsx:88-90` and `:232-234`
**Issue:** Any `VITE_*` variable is statically inlined into the JavaScript bundle by Vite at build time. The `VITE_ANTHROPIC_API_KEY` variable is read directly in the browser and passed to `new Anthropic({ apiKey, dangerouslyAllowBrowser: true })`. This means:
- The key is visible to anyone who opens DevTools and inspects the bundle (production or dev).
- The `.env.example` explicitly warns against this, yet the dev escape-hatch adds the same risk.
- If `VITE_ANTHROPIC_API_KEY` is ever set in Vercel's environment variables (easy mistake), it will be present in every production deployment.

The `import.meta.env.DEV` guard does NOT prevent the key from appearing in the bundle. Vite replaces `import.meta.env.DEV` with `false` in production builds, but it still includes the surrounding code and variable reference. The key string is still embedded.

**Fix:** Remove the browser-direct path entirely. Always route through `/api/analyze` regardless of environment. For local development without `vercel dev`, add a minimal Express or `http-server` shim, or just run `vercel dev`. The DEV-path shortcut is not worth the key exposure risk.

```javascript
// REMOVE these entire DEV branches in both runAnalysis() and askQuestion():
// if (import.meta.env.DEV) { ... }

// KEEP only the fetch path in both functions:
async function runAnalysis() {
  // ...
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage }),
  })
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  const data = await res.json()
  raw = data.analysis
  // ...
}
```

Also remove `VITE_ANTHROPIC_API_KEY` from `.env.example` so future developers are not tempted to set it.

---

### CR-02: Serverless endpoint accepts arbitrary system prompt override (prompt injection)

**File:** `api/analyze.js:34,36`
**Issue:** The handler destructures `system` from the request body and uses it as the system prompt if provided:

```javascript
const { userMessage, system } = await req.json()
const systemPrompt = system ?? `You are a CSE analyst...`
```

Any caller (including a browser script, a `curl` command, or a malicious tab) can POST to `/api/analyze` with a custom `system` field and completely replace the system prompt. This endpoint has `Access-Control-Allow-Origin: *`, so it is callable from any origin. An attacker can:
- Exfiltrate signal data by overriding the prompt to "repeat everything back verbatim"
- Use your Anthropic API key quota to run arbitrary LLM workloads
- Trick the model into producing harmful output attributed to your company

The `ChatBar` component legitimately passes `system: CHAT_SYSTEM_PROMPT`, which is fine, but the server should not trust that value from the client.

**Fix:** Remove the `system` field from the client contract entirely. Define all system prompts server-side only, and select between them with a safe enum:

```javascript
// api/analyze.js
const SYSTEM_PROMPTS = {
  analysis: `You are a CSE analyst at HousecallPro...`,
  chat: `You are a CSE analyst at HousecallPro. Answer questions...`,
}

export default async function handler(req) {
  // ...
  const { userMessage, mode } = await req.json()

  // Only accept known modes — default to 'analysis'
  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.analysis

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  // ...
}
```

On the client, change `{ userMessage, system: CHAT_SYSTEM_PROMPT }` to `{ userMessage, mode: 'chat' }`.

---

## Warnings

### WR-01: `fetchPosts` infinite loop risk — missing upper bound on pagination

**File:** `src/api/supabase.js:36-45`
**Issue:** The `while (true)` pagination loop in `fetchPosts` has no circuit-breaker. If Supabase returns exactly `PAGE_SIZE` rows on every page forever (data growth, bug, or unexpected server behavior), the loop never terminates and the dashboard hangs. With 10,000+ posts this is increasingly likely if posts table grows past a multiple of 1,000.

```javascript
while (true) {                          // no exit condition other than page.length < PAGE_SIZE
  const page = await fetchSupabase(...)
  all.push(...page)
  if (page.length < PAGE_SIZE) break    // only exit
  offset += PAGE_SIZE
}
```

**Fix:** Add a maximum page guard:
```javascript
const MAX_PAGES = 50 // 50,000 rows max
let pages = 0
while (pages < MAX_PAGES) {
  const page = await fetchSupabase(...)
  all.push(...page)
  pages++
  if (page.length < PAGE_SIZE) break
  offset += PAGE_SIZE
}
if (pages >= MAX_PAGES) {
  console.warn('fetchPosts: hit MAX_PAGES limit — data may be truncated')
}
```

---

### WR-02: `formatWeekRangeLabel` crashes when `getWeekRange` returns null

**File:** `src/utils/dateRanges.js:63-66`
**Issue:** `formatWeekRangeLabel` calls `getWeekRange(isoWeek)` and immediately destructures `{ start, end }` from the result without checking for null. `getWeekRange` explicitly returns `null` for invalid input. If a null week value ever reaches `formatWeekRangeLabel` (e.g., `weekOptions[0]` is empty, or an edge-case ISO string from a malformed date), this crashes with `Cannot destructure property 'start' of null`.

```javascript
export function formatWeekRangeLabel(isoWeek) {
  const { start, end } = getWeekRange(isoWeek) // CRASH if getWeekRange returns null
```

This function is called in `FilterPills.jsx:119` and `BrowseTab.jsx:317` — both in rendered JSX — so a crash here would blank the dropdown without any error message.

**Fix:**
```javascript
export function formatWeekRangeLabel(isoWeek) {
  const range = getWeekRange(isoWeek)
  if (!range) return isoWeek ?? ''
  const { start, end } = range
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}
```

---

### WR-03: No input length limit on the chat bar — token exhaustion risk

**File:** `src/components/ui/AIInsightsTab.jsx:76-116`
**Issue:** The `askQuestion` function in `ChatBar` accepts any-length user input and passes it directly to the API:

```javascript
const userMessage = `${context}\n\nQuestion: ${question}`
```

`context` is built from all signals and top sources (can be hundreds of characters), then the user question is appended with no length cap. A user (or anyone with DevTools) can type or paste several kilobytes of text, exhausting tokens and potentially hitting Anthropic's rate limits. The `max_tokens: 512` limit only applies to the response, not the combined input.

**Fix:** Add a character limit on the input field and validate before sending:
```javascript
const MAX_QUESTION_LENGTH = 500

async function askQuestion() {
  const question = input.trim()
  if (!question || chatLoading) return
  if (question.length > MAX_QUESTION_LENGTH) {
    setMessages(prev => [...prev, { role: 'assistant', text: `Question is too long (max ${MAX_QUESTION_LENGTH} characters).` }])
    return
  }
  // ...
}
```

Also add `maxLength={500}` to the `<input>` element as a UI guard.

---

### WR-04: `BrowseTab` cancellation flag does not prevent `setLoading(false)` on cancel

**File:** `src/components/ui/BrowseTab.jsx:169-233`
**Issue:** The `cancelled` flag is checked before `setSignalsForDate` and `setError`, but `setLoading(false)` in the `finally` block runs even when the effect was cancelled:

```javascript
} finally {
  if (!cancelled) setLoading(false)  // line 227 — actually this IS guarded, see below
}
```

On re-reading: this is actually guarded on line 227. However, there is a subtler issue on lines 179-184: when `granularity === 'day'` and `isValidDateString` fails, the function returns early **without calling `setLoading(false)`**:

```javascript
if (granularity === 'day') {
  if (!isValidDateString(selectedDate)) {
    setSignalsForDate([])
    setPostsForDate([])
    return   // <-- returns BEFORE finally — setLoading(false) never called
  }
```

The `try/finally` is at the outer `load()` function level, but this `return` exits the `if` block inside the `try`, skipping the `finally` block. The spinner stays visible forever after typing an invalid date.

**Fix:** Move the guard to also clear loading state, or restructure so `setLoading(false)` always runs:
```javascript
if (granularity === 'day') {
  if (!isValidDateString(selectedDate)) {
    setSignalsForDate([])
    setPostsForDate([])
    setLoading(false)  // add this
    return
  }
```

---

### WR-05: `PipelineTab` signal-rate formula is wrong — divides signals by (signals + posts)

**File:** `src/components/ui/PipelineTab.jsx:38-41`
**Issue:** The weekly `rate` computation divides `signalCount` by `signalCount + postCount`:

```javascript
const signalCount = (row.churn || 0) + (row.enrollment || 0) + (row.upsell || 0)
const total = signalCount + postCount          // <-- wrong denominator
const rate = total > 0 ? Math.round((signalCount / total) * 100) : 0
```

The intended metric is "what percentage of posts became signals," so the denominator should be `postCount` only. Using `total` understates the conversion rate (a week with 100 posts and 10 signals should show 10%, but this formula shows ~9.1%).

This is inconsistent with how `overallRate` is computed on line 46, which correctly uses `totalPosts` as the denominator.

**Fix:**
```javascript
const rate = postCount > 0 ? Math.round((signalCount / postCount) * 100) : 0
```

---

### WR-06: `SignalVolumeChart` click handler passes the wrong payload — week label is raw ISO string, not formatted

**File:** `src/components/charts/SignalVolumeChart.jsx:27,61`
**Issue:** The click handler is:
```javascript
const click = onBarClick ? (entry) => onBarClick(entry.week) : undefined
```

`entry.week` here is the raw ISO week key from `groupByWeek` (e.g., `"2026-W17"`). The handler in `App.jsx` line 203 then filters signals by:
```javascript
return getISOWeekLabel(new Date(s.created_at)) === weekLabel
```

This comparison is correct — it compares ISO week labels. However, the `activeDot` `onClick` payload from Recharts is not the chart data entry directly. It is a Recharts event object shaped `{ payload: { week, churn, ... } }`. The click handler reads `entry.week`, but the Recharts `activeDot.onClick` receives `(event, payload)` where `payload` is the data point.

Looking at the call: `onClick: (_, payload) => click(payload)` — so `payload` here is `{ week, churn, ... }` and `payload.week` is the ISO key. This happens to work when Recharts passes the data object as the second argument. But the first argument `_` is actually the SVG event, and the second is the Recharts payload wrapper `{ dataKey, index, payload: {...} }` — so `payload.week` would be `undefined`. The correct path is `payload.payload.week`.

**Fix:**
```javascript
activeDot={click ? { r: 6, onClick: (_, payload) => click(payload.payload.week) } : { r: 6 }}
```

Verify this against Recharts v3 docs for `activeDot.onClick` signature.

---

### WR-07: `AIInsightsTab` runs auto-analysis on mount with no `signals` guard — fires even on empty data

**File:** `src/components/ui/AIInsightsTab.jsx:207-219`
**Issue:** `runAnalysis()` is called unconditionally on mount (when there is no cached result). If `signals` is an empty array (e.g., Supabase returned nothing due to a transient error, or the tab is opened before data loads), `buildSummary` produces a message with `0` signals and `0` key quotes, which wastes an Anthropic API call and returns a meaningless analysis that gets cached.

```javascript
useEffect(() => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) { ... return }
  } catch { /* fall through */ }
  runAnalysis()   // fires even with signals.length === 0
}, [])
```

**Fix:** Add a guard:
```javascript
useEffect(() => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) { ... return }
  } catch { /* fall through */ }
  if (signals.length > 0) {
    runAnalysis()
  }
}, [])
```

---

## Info

### IN-01: `pillStyle` function is duplicated in three files

**Files:** `src/App.jsx:44-56`, `src/components/ui/BrowseTab.jsx:35-47`, `src/components/ui/FilterPills.jsx:8-19`

The exact same `pillStyle(active)` function is copy-pasted in all three files. The `App.jsx` copy even has a comment saying "Copied from FilterPills.jsx lines 8-19."

**Fix:** Extract to `src/components/ui/pillStyle.js` and import in all three places.

---

### IN-02: `PostsVsSignalsChart` and `aggregate.js` both implement ISO week computation independently

**Files:** `src/components/charts/PostsVsSignalsChart.jsx:5-20`, `src/utils/aggregate.js:63-70`, `src/utils/dateRanges.js:8-15`

The ISO week label algorithm (Thursday-anchor method) is copy-pasted three times across the codebase. The `dateRanges.js` copy is already documented as a workaround to avoid circular imports, but `PostsVsSignalsChart.jsx` has its own private `countByWeek` and `formatWeek` functions that duplicate the same logic again.

**Fix:** Import `getISOWeekLabel` and `formatWeekLabel` from `utils/aggregate.js` into `PostsVsSignalsChart`. The circular import concern does not apply to chart components.

---

### IN-03: `MatchByTypeChart` and `TopOrgsTable` use Tailwind CSS classes, all other components use inline styles

**Files:** `src/components/charts/MatchByTypeChart.jsx:18`, `src/components/charts/TopOrgsTable.jsx:8-28`

These two files use Tailwind CSS class names (`text-sm`, `text-gray-400`, `w-full`, etc.) while every other file in the project uses inline style objects exclusively. Neither component is currently rendered anywhere in the visible dashboard (no import found in App.jsx or any tab). This is dead code with a conflicting style approach.

**Fix:** If these components are intended for future use, convert to inline styles to match the project convention. If they are abandoned, delete them.

---

### IN-04: `SignalDrawer` is dead code — replaced by `SignalModal` but never deleted

**File:** `src/components/ui/SignalDrawer.jsx`

`SignalDrawer` is imported nowhere in the current codebase (verified by cross-reference). The modal replacement is complete. The drawer adds ~53 lines of dead code and the style comments reference a drawer UX that no longer exists.

**Fix:** Delete `src/components/ui/SignalDrawer.jsx`.

---

### IN-05: No error boundary wrapping chart components

**File:** `src/App.jsx` (all chart renders)

None of the chart components (`SignalVolumeChart`, `CommunityChart`, `ConfidenceHistogram`, etc.) are wrapped in React error boundaries. A single bad data row (e.g., a `confidence` value of `"N/A"` that slips past the `isNaN` guard) could throw during render and unmount the entire dashboard. React 19 surfaces these as white screens.

**Fix:** Add a simple error boundary wrapper around each `<Panel>` that contains a chart, or create a `<ChartErrorBoundary>` component that renders a placeholder on error:
```javascript
class ChartErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return <p style={{ fontSize: 12, color: '#D81860', margin: 0 }}>Chart could not render.</p>
    }
    return this.props.children
  }
}
```

---

### IN-06: `fetchSignals` and `fetchSignalsByDate`/`fetchSignalsByRange` select identical column lists — magic string duplicated three times

**File:** `src/api/supabase.js:24,57,76`

The same long `select=id,created_at,...` column list is copy-pasted into three separate query strings. If a new column is added to the dashboard (e.g., a new routing field), it must be added in three places. Missing it in one place causes silent undefined values in that fetch path.

**Fix:** Extract the column list as a constant:
```javascript
const SIGNAL_COLUMNS = 'id,created_at,captured_date,signal_type,...'

export async function fetchSignals() {
  return fetchSupabase(`signals?select=${SIGNAL_COLUMNS}&limit=10000`)
}
```

---

### IN-07: `AIInsightsTab` `runAnalysis` does not re-run when `signals` prop changes

**File:** `src/components/ui/AIInsightsTab.jsx:207-219`

The auto-run `useEffect` has an empty dependency array `[]`, so it only fires on mount. If the parent ever re-renders `AIInsightsTab` with a different `signals` array (e.g., after a future "refresh data" feature), the analysis still shows stale results from the cache. The `runAnalysis` function closes over `signals` from the render scope, so manually clicking "Re-analyze" uses the current signals — only the auto-run is stale.

This is not a bug today (signals are loaded once at app startup), but it is a fragility worth noting before adding refresh functionality.

**Fix (informational):** Document the intentional one-shot behavior with a comment, or add `signals.length` to the dependency array with a cache invalidation check.

---

### IN-08: `supabase.js` has no authentication beyond the anon key — row-level security posture is not verified in code

**File:** `src/api/supabase.js:1-8`

The Supabase anon key grants read access to every table the project's RLS policies allow. The dashboard fetches `signals` and `posts` including fields like `email`, `phone`, `org_id`, and `user_id` — PII adjacent data. The code correctly uses the anon key (not a service role key), but there is no code-level documentation confirming that Supabase RLS is enabled and restricting these tables to read-only access for the anon role.

This is not a code bug, but it is worth documenting: if RLS is disabled on the `signals` table (the Supabase default for new tables), the anon key exposes all signal rows to anyone who finds the key in the browser bundle.

**Recommendation:** Confirm that RLS is enabled on both tables with a read-only policy for `anon`. Add a comment to `supabase.js` noting this assumption. Consider filtering out PII columns (`email`, `phone`) from the select list if they are not rendered in the UI (they appear only in `SignalDetail` which is internal-only, so this may be acceptable).

---

_Reviewed: 2026-05-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
