# CSE Signal Dashboard

Internal React dashboard for the HousecallPro CSE (Community Signal Engine) team. Tracks churn and enrollment/upsell signals detected from community posts, with AI-powered analysis via Claude.

## What It Does

Five tabs, all pulling live data from Supabase:

- **Churn** — signals flagged for potential churn: match rates, confidence scores, severity breakdown, top sources and categories, signal volume over time
- **Enrollment & Upsell** — growth opportunity signals, same metrics split by enrollment vs upsell
- **Community** — post volume and engagement across community sources
- **Pipeline** — posts ingested vs signals generated, match rate trends
- **AI Insights** — Claude automatically analyzes the current signal data and surfaces patterns, urgent items, and recommendations (requires an Anthropic API key for local dev)

Filters at the top (time period + match status) affect all tabs and charts simultaneously.

## Tech Stack

- Vite + React (no TypeScript, inline styles only)
- Recharts (charts)
- HousecallPro Compass design tokens (inline styles, no Tailwind)
- Supabase REST API (PostgREST) — anon key, client-side fetch
- Anthropic SDK (`@anthropic-ai/sdk`) — AI Insights tab
- Vercel (deployment, serverless function for AI in production)
- Vitest (unit tests)

## Local Development

1. Clone the repo
2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` in the project root with your credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional — only needed to use the AI Insights tab locally
VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
```

4. Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

> **AI Insights in production:** The `VITE_ANTHROPIC_API_KEY` is for local dev only and never deployed. In production, the AI tab calls a Vercel serverless function (`api/analyze.js`) that reads `ANTHROPIC_API_KEY` from Vercel's environment variables — set that in your Vercel project settings before deploying.

## Key Decisions

- **Client-side aggregation** — Supabase PostgREST doesn't support GROUP BY, so all grouping happens in the browser via `src/utils/aggregate.js`
- **match_method "not_found"** — unmatched signals use the string `"not_found"`, not `null` — all match rate filters account for this
- **Posts pagination** — the posts table has 8,400+ rows; `fetchPosts()` paginates in 1,000-row batches since Supabase caps responses at 1,000 rows
- **Anon key only** — no service role key in the frontend; Supabase Row Level Security must have a SELECT policy enabled for the anon role
- **Pre-aggregated AI summary** — the AI Insights tab sends a text summary of signal counts and trends to Claude (not raw data), keeping token usage low and latency fast

## Roadmap

- **Phase 01** ✓ — Static dashboard with all metric panels wired to real Supabase data
- **Phase 02** ✓ — Time period filtering (7d/30d/90d/all), match status filter, signal volume chart
- **Phase 03** ✓ — Dashboard polish and UX improvements (Browse tab, category/severity panels, filter pills)
- **Phase 04** ✓ — Bug fixes: match filter applies to all charts, partial-week chart guard
- **Phase 05** ✓ — AI Insights tab: Claude auto-analyzes signal data on load, no manual trigger needed
