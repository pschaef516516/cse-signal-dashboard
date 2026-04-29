# CSE Signal Dashboard

Internal React dashboard for the HousecallPro CSE (Community Signal Engine) team. Displays pipeline metrics for churn and enrollment/upsell signals detected from community posts.

## What It Does

- **Churn tab** — signals flagged for potential churn, match rates, confidence scores, severity breakdown, and community sources
- **Enrollment & Upsell tab** — signals flagged for growth opportunities, same metrics split by signal type
- **Pipeline overview** — posts ingested vs signals generated over time
- Live data from Supabase, aggregated client-side

## Tech Stack

- Vite + React
- Recharts (charts)
- Tailwind CSS + HousecallPro Compass design tokens (inline styles)
- Supabase REST API (PostgREST) — anon key, client-side fetch
- Vercel (deployment)
- Vitest (unit tests)

## Local Development

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Key Decisions

- **Client-side aggregation** — Supabase PostgREST doesn't support GROUP BY, so all grouping happens in the browser via `src/utils/aggregate.js`
- **match_method "not_found"** — unmatched signals use the string `"not_found"`, not `null` — all match rate filters account for this
- **Posts pagination** — the posts table has 8,400+ rows; `fetchPosts()` paginates in 1,000-row batches since Supabase caps responses at 1,000 rows
- **Anon key only** — no service role key in the frontend; Supabase Row Level Security must have a SELECT policy enabled for the anon role

## Roadmap

- **Phase 01** ✓ — Static dashboard with all metric panels wired to real Supabase data
- **Phase 02** — Time period filtering (7d/30d/90d/all), clickable chart drill-downs, signal detail view
- **Phase 03** — Claude AI analysis integration (pattern detection, urgent signals, weekly summaries)
