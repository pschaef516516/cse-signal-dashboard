# Phase 05: Claude AI Analysis - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Claude AI into the dashboard as a new "AI Insights" tab. When a CSM opens the tab, Claude automatically runs an analysis of the current signal pipeline and displays the result. No user input required to trigger it.

This phase covers:
1. **AI Insights tab** — 5th top-level tab, after Pipeline
2. **Auto analysis on load** — Claude runs when the tab is opened, analyzes all signals (Churn + E&U combined), and displays a written summary
3. **Vercel serverless function** — API route at `api/analyze.js` proxies requests to Anthropic, keeping the API key server-side
4. **Loading state** — Spinner while Claude processes; full response renders at once when done

This phase does NOT add: free-form Q&A chat, urgent signal flagging, weekly digest summaries, or per-signal AI buttons. Those are deferred to Phase 06.

</domain>

<decisions>
## Implementation Decisions

### AI Insights Tab
- **D-01:** Add a 5th top-level tab labeled "AI Insights" in the tab row after "Pipeline". Tab ID: `ai`.
- **D-02:** The tab renders a new `AIInsightsTab.jsx` component. No new state in App.jsx beyond the active tab — the component fetches and manages its own AI state internally.

### Auto Analysis on Load
- **D-03:** When the AI Insights tab is opened (i.e., becomes the active tab), the component automatically triggers a Claude analysis — no button press required.
- **D-04:** Claude analyzes all signals combined (both Churn and E&U), not scoped to a single tab. The goal is a full pipeline picture.
- **D-05:** Data sent to Claude is a pre-aggregated summary object, NOT raw signal rows. The summary includes: total signal count, matched count, match rate %, high-severity count, signal count by type (churn vs E&U), top 3 sources by count, top 3 categories by count, and the current date. This keeps costs low and avoids token limit issues.

### Response Display
- **D-06:** While Claude is processing, show a loading spinner (or a simple "Analyzing signals..." text state) in place of the response area.
- **D-07:** When the response arrives, render the full text at once — no streaming. Simple and reliable.
- **D-08:** Response renders as plain text or lightly formatted markdown (bullet points, bold headings). No special card/panel treatment — just readable prose inside a Panel component.

### API Key / Serverless Function
- **D-09:** Local dev reads `VITE_ANTHROPIC_API_KEY` (or `ANTHROPIC_API_KEY`) from `.env.local`. The Vite dev server proxies requests to a local handler or the component calls the Vercel function URL directly.
- **D-10:** Production uses a Vercel serverless function at `api/analyze.js`. The `ANTHROPIC_API_KEY` environment variable is set in Vercel project settings (never in frontend code). `vercel.json` needs an API route entry added.
- **D-11:** Use `claude-haiku-4-5-20251001` (Haiku) for this feature — fast, cheap, sufficient for summarization. Can upgrade to Sonnet later if needed.

### Claude's Discretion
- Exact wording/structure of the system prompt sent to Claude
- How to handle Claude API errors (show a friendly error message in the panel)
- Whether to cache the analysis result in component state so re-opening the tab doesn't re-run Claude every time
- Exact loading spinner style (reuse any existing loading pattern or simple text)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to create
- `src/components/ui/AIInsightsTab.jsx` — New tab component; owns fetch state, loading state, response display
- `api/analyze.js` — Vercel serverless function; receives aggregated summary, calls Anthropic API, returns Claude's response

### Files to modify
- `src/App.jsx` — Add `ai` tab to TABS array; pass signals/posts to AIInsightsTab for aggregation
- `vercel.json` — Add API route so `/api/analyze` is served by the serverless function
- `.env.example` — Add `ANTHROPIC_API_KEY` entry as documentation

### Design tokens (Compass — inline styles only, no Tailwind)
- Background: `#FAFBFF`, Primary: `#0057FF`, Border: `#E1E6F2`, Text: `#15181D`
- Muted: `#6B7487`, Danger/churn: `#D81860`, Success: `#00A344`

### Project constraints
- `.planning/PROJECT.md` — Inline styles only, useState only, Supabase REST, no SDK
- API key MUST NOT appear in frontend code — always from env vars
- Anon/publishable key only — no service_role key in frontend

### Anthropic SDK
- Use the official `@anthropic-ai/sdk` npm package in the serverless function
- Latest Claude model IDs: Haiku 4.5 = `claude-haiku-4-5-20251001`, Sonnet 4.6 = `claude-sonnet-4-6`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Panel` component (used throughout App.jsx) — wraps content in a white rounded panel with title; use for the AI response display area
- `StatCard` component — not needed for AI tab, but the aggregation logic that feeds StatCard (in App.jsx) is the same aggregation to send to Claude
- `PlaceholderPanel.jsx` — shows "available after X" placeholder; can use as loading state inspiration

### Established Patterns
- Tab pattern: `TABS` array in App.jsx drives the tab row; each tab has `{ id, label }`; content rendered via `activeTab === tab.id` conditionals
- Data flow: App.jsx fetches `signals` and `posts` from Supabase, passes them down to tab components
- Inline styles only — no Tailwind, no CSS files
- Error states: not formalized yet — keep it simple (inline error message)

### Integration Points
- App.jsx TABS array → add `{ id: 'ai', label: 'AI Insights' }`
- App.jsx content block → add `{isAI && <AIInsightsTab signals={signals} />}`
- `aggregate.js` utils → reuse `groupByWeek`, `filterByRange` to compute the summary object passed to Claude
- Vercel function at `api/analyze.js` receives a POST with the aggregated summary JSON

</code_context>

<specifics>
## Specific Ideas

- The pre-aggregated summary should be computed client-side (in `AIInsightsTab.jsx` or a util) before being sent to the serverless function — keeps the function simple (just calls Anthropic and returns the response)
- The analysis should cover both Churn and E&U signals together since the AI tab is standalone and not scoped to a single tab
- Haiku is the right model to start: fast (~1-2s), cheap ($0.25/million input tokens), and more than capable for pipeline summarization

</specifics>

<deferred>
## Deferred Ideas

- **Free-form Q&A chat** — CSMs type questions and Claude answers. Phase 06.
- **Urgent signal flagging** — Claude highlights top 3-5 signals needing immediate attention. Phase 06.
- **Weekly summary digest** — Formatted weekly recap designed for Slack/Confluence sharing. Phase 06.
- **Per-signal AI button** — "Analyze this signal" button inside the signal modal. Phase 06.
- **Streaming response** — Patrick chose full response on load for now; streaming can be added later if the wait feels too long.
- **Model upgrade** — Starting with Haiku; upgrade to Sonnet if the analysis quality feels thin.

</deferred>

---

*Phase: 05-claude-ai-analysis*
*Context gathered: 2026-05-01*
