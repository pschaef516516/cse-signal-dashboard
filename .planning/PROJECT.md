# CSE Signal Dashboard

## What This Is

An internal React dashboard that reads from Supabase and displays all CSE (Community Signal Engine) pipeline metrics. Built for the HousecallPro CSE team to monitor churn signals, enrollment/upsell signals, match rates, community sources, and signal quality — split into a Churn tab and an Enrollment & Upsell tab.

## Core Value

Give the CSE team a single place to see what the signal pipeline is detecting, how well it's matching to HCP orgs, and where to focus their attention — without needing to query Supabase directly.

## Tech Stack

- Vite + React (frontend)
- Tailwind CSS + inline Compass design system styles
- Recharts (charts)
- Supabase REST API (PostgREST) — client-side fetch, no SDK
- Vercel (deployment via GitHub)
- Vitest (unit tests)

## Requirements

### Validated
- Dashboard fetches from Supabase using VITE_ env vars
- Churn and Enrollment/Upsell tabs with filtered data
- All chart panels render real Supabase data
- Aggregation utilities pass unit tests
- Deploys to Vercel

### Active
- Phase 2: Time filtering, drill-downs, signal detail views
- Phase 3: Claude AI analysis integration

### Out of Scope
- Real-time / WebSocket updates (polling or manual refresh is fine)
- User authentication (internal tool, no login needed)
- Mobile layout (desktop-only)

## Key Decisions

- **Client-side aggregation**: Supabase PostgREST doesn't support GROUP BY, so all grouping happens in the browser via aggregate.js utilities
- **match_method "not_found"**: Unmatched signals use the string "not_found" not null — all match rate filters account for this
- **Pagination**: Posts table has 8,400+ rows; fetchPosts() paginates in 1,000-row batches
- **Compass design system**: Using HousecallPro's internal design tokens (colors, typography) for visual consistency

## Constraints

- API key must never be hardcoded — always from .env.local / Vercel env vars
- No service_role key in frontend — anon/publishable key only
- Keep all data aggregation client-side (no backend required for Phase 1-2)
