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

### Phase 03 — Dashboard Polish & UX
**Goal:** Elevate the dashboard UX before adding AI: replace the signal drawer with a centered navigator modal (Prev/Next), redesign the Browse tab with time granularity tabs and filter pills, replace rolling time pills with calendar-anchored filters (Today/Yesterday/Week/Month/All), add a Pipeline tab for scraper health metrics, and surface signal category breakdowns + Active/Churned status badges on signal cards.

**Depends on:** Phase 02

**Plans:** 5/5 plans complete
- [x] 03-01-PLAN.md — Signal Navigator Modal (new SignalModal.jsx, retire SignalDrawer, wire into App.jsx)
- [x] 03-02-PLAN.md — Browse Tab Redesign (Day/Week/Month/All Time tabs + filter pills)
- [x] 03-03-PLAN.md — Time Filter Redesign (calendar-anchored Today/Yesterday/Week↓/Month↓/All)
- [x] 03-04-PLAN.md — Pipeline Tab (new PipelineTab.jsx, 4th tab in App.jsx)
- [x] 03-05-PLAN.md — Category & Status Breakdowns (category chart + Active/Churned badge + % Preventable Churn)

### Phase 04 — Browse UX & Data Clarity
**Goal:** Fix the two biggest UX gaps before adding AI: (1) Browse tab signals and posts sections scroll infinitely — cap them at 400px with overflow scroll so the page doesn't grow unbounded. (2) CSMs need to act differently on matched vs unmatched signals — add All / Matched / Unmatched filter tabs to the Churn, E&U, and Browse signal lists. Also fold in two Phase 03 polish gaps: hide the Signal Volume chart for sub-7-day periods (shows a single broken dot), and add an "Updated daily through yesterday" note to the Posts Ingested stat card to explain the 1-day pipeline delay.

**Depends on:** Phase 03

**Plans:** 3 plans

- [ ] 04-01-PLAN.md — App.jsx: match filter state for Churn/E&U + sub-7-day Signal Volume chart guard
- [ ] 04-02-PLAN.md — BrowseTab.jsx: 400px scroll bounds for signals/posts + match filter pill row
- [ ] 04-03-PLAN.md — PipelineTab.jsx: 'Updated daily through yesterday' subtext on Posts Ingested

### Phase 05 — Claude AI Analysis
**Goal:** Integrate Claude AI into the dashboard so the CSE team can ask questions about signals and get automatic analysis (pattern detection, urgent signals, weekly summaries). Local dev uses .env.local API key; production routes through a Vercel serverless function to keep the key server-side.

**Depends on:** Phase 04

**Plans:** (not yet planned)
