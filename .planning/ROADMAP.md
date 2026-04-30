# CSE Signal Dashboard — Roadmap

## Milestone 1: MVP Dashboard

### Phase 01 — CSE Signal Dashboard (COMPLETE)
**Goal:** Build a static React dashboard reading from Supabase displaying all CSE signal pipeline metrics — live panels wired to real data, placeholder panels for future data, deployed to Vercel.

**Depends on:** nothing

**Plans:**
- 01-01: Full dashboard build (scaffold → API → utils → charts → deploy)

### Phase 02 — Filtering, Drill-downs & Signal Detail (COMPLETE)
**Goal:** Add time period filtering (7d/30d/90d/all), clickable charts that drill into individual signals, a signal detail view showing key quote + summary + suggested action, a more data-rich Enrollment & Upsell tab, and a Browse tab for raw signals + posts on a selected date.

**Depends on:** Phase 01

**Plans:** 6/6 complete
- [x] 02-01-PLAN.md — Data layer: filterByDateRange, groupBySourceAndType, export getISOWeekLabel, fetchSignals/fetchPosts column expansion, fetchSignalsByDate, fetchPostsByDate
- [x] 02-02-PLAN.md — Presentational components: FilterPills, SignalDrawer, SignalCard, SignalDetail
- [x] 02-03-PLAN.md — Chart onClick wiring + new EnrollmentUpsellSplitChart and clickable EUCommunityChart
- [x] 02-04-PLAN.md — App.jsx integration: filter state, drawer wiring, TopOrgsTable removal, E&U enrichment, TABS Browse entry, uniqueOrgs/PostsVsSignalsChart filter fixes
- [x] 02-05-PLAN.md — Browse tab: date picker, signals + posts lists, drawer reuse, empty states (D-15–D-20)
- [x] 02-06-PLAN.md — End-to-end visual + interaction verification (human checkpoint, includes Browse)

### Phase 03 — Claude AI Analysis
**Goal:** Integrate Claude AI into the dashboard so the CSE team can ask questions about signals and get automatic analysis (pattern detection, urgent signals, weekly summaries). Local dev uses .env.local API key; production routes through a Vercel serverless function to keep the key server-side.

**Depends on:** Phase 02

**Plans:** (not yet planned)
