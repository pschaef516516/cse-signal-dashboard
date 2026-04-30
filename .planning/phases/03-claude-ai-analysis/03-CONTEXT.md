# Phase 03: Dashboard Polish & UX - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Elevate the dashboard UX before adding AI. Five capability areas:
1. Signal Navigator Modal — replace the right-side drawer shelf with a centered modal + Prev/Next navigation
2. Browse Tab Redesign — Day/Week/Month/All Time granularity tabs with filter pills on signals
3. Time Filter Redesign — replace rolling 7d/30d/90d pills with calendar-anchored options + picker for Week/Month
4. Pipeline Tab — new 4th tab for scraper health and ingestion metrics
5. Category & Status Breakdowns — signal category chart per tab, Active/Churned badge on signal cards, clickable category drill-down

This phase does NOT add AI/Claude integration (deferred to Phase 04) or write data back to Supabase.

</domain>

<decisions>
## Implementation Decisions

### Signal Navigator Modal
- **D-01:** Clicking a signal anywhere (Churn tab, E&U tab, Browse tab) opens a centered modal (~700px wide) going directly to the signal detail view — no intermediate list step.
- **D-02:** Prev/Next arrow buttons sit at the top of the modal. Shows current position: "3 of 12 signals". Navigates through the full signal list for the current context (drill-down results, or all signals for the selected Browse date/period).
- **D-03:** Modal closes via: clicking the backdrop, clicking the X button (top-right corner), or pressing Escape.
- **D-04:** In Browse tab, Prev/Next navigates through all signals loaded for the currently selected date or time period.
- **D-05:** Replaces `SignalDrawer` everywhere — `SignalDrawer.jsx` is retired. New component: `SignalModal.jsx`.

### Browse Tab Redesign
- **D-06:** Replace the single date picker with time granularity tabs: Day | Week | Month | All Time. Day tab retains the existing date picker (default: yesterday). Week and Month tabs show a dropdown to select which specific week or month.
- **D-07:** Filters (source, severity, signal type, confidence) apply to the signals section only — posts do not have severity/confidence/type. Posts section has no filters.
- **D-08:** Filters displayed as a row of filter pills above the signals table. Each pill opens a dropdown when clicked. Active filters render as filled/colored pills so the user can see what's applied at a glance.
- **D-09:** "All Time" tab on Browse loads all signals and posts without a date constraint.

### Time Filter Redesign (Churn + E&U tabs)
- **D-10:** Replace 7d/30d/90d/All pills with: Today | Yesterday | Week ↓ | Month ↓ | All. Today and Yesterday are instant single-click filters. Week and Month open a dropdown picker to select a specific week/month. All shows everything.
- **D-11:** "Last Week" = the previous full calendar week (Mon–Sun). "Last Month" = the previous full calendar month. These are calendar-anchored, not rolling windows.

### Pipeline Tab
- **D-12:** Tab order: Churn / Enrollment & Upsell / Browse / Pipeline.
- **D-13:** Pipeline tab content: Posts Ingested vs Signals Generated chart (restored from Phase 02 removal), overall signal rate % trend, posts ingested breakdown by community source, and pipeline volume over time. This is the home for scraper health metrics — not signal analysis.
- **D-14:** Pipeline tab does not use the time filter pills (it shows all-time pipeline data by default, or has its own time controls TBD by Claude).

### Category & Status Breakdowns
- **D-15:** Each tab (Churn, E&U) gets a "Signal Categories" section below the Signal Sources section. Churn tab shows churn category breakdown (e.g. churn_price_complaint, churn_competitor_comparison). E&U tab shows enrollment category breakdown (e.g. enrollment_upsell_opportunity).
- **D-16:** Category chart is clickable — clicking a category bar opens the Signal Navigator Modal (D-01) filtered to signals of that category. Consistent with all other clickable charts.
- **D-17:** Active/Churned status badge: a small colored pill displayed inline next to the org name on each signal card. Green pill = "Active", red pill = "Churned". Uses the `status` and `customer_status` columns; falls back to checking `churn_date` if status fields are empty.
- **D-18:** % Preventable Churn stat card — new stat card on the Churn tab using the `preventability` column. Shows percentage of churn signals where preventability = 'high'.

### Claude's Discretion
- Exact animation/transition style for the modal (fade in, scale up, or slide)
- Week/month dropdown picker implementation details (native select or custom)
- Filter pill dropdown positioning and animation
- Whether Pipeline tab has its own time controls or is always all-time
- Category chart type (horizontal bar, donut, or vertical bar)
- Badge styling details (font size, pill padding, exact shade of green/red within Compass tokens)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing components to modify or retire
- `src/components/ui/SignalDrawer.jsx` — RETIRE this component; replace with SignalModal
- `src/components/ui/SignalDetail.jsx` — KEEP, render inside new SignalModal
- `src/components/ui/SignalCard.jsx` — ADD Active/Churned badge next to org name
- `src/components/ui/FilterPills.jsx` — REPLACE with new calendar-anchored time filter
- `src/components/ui/BrowseTab.jsx` — REDESIGN per D-06 through D-09
- `src/App.jsx` — Update tab list, drawer state, filter state; wire new modal and Pipeline tab
- `src/utils/aggregate.js` — May need new groupByCategory utility for category breakdown chart
- `src/utils/format.js` — Shared date/confidence formatters (already extracted)

### Design tokens (Compass — must use these, no Tailwind)
- Background: `#FAFBFF`, Primary: `#0057FF`, Border: `#E1E6F2`, Text: `#15181D`
- Muted: `#6B7487`, Danger/churn: `#D81860`, Success: `#00A344`

### Project constraints
- `.planning/PROJECT.md` — Inline styles only (no Tailwind in components), useState only, Supabase REST, Vercel deploy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SignalDetail.jsx` — Full detail view already built; just needs to render inside new modal instead of drawer
- `StatCard.jsx` — Reuse for % Preventable Churn card
- `Panel.jsx` (inline in App.jsx) — Reuse for category section and Pipeline tab panels
- `groupByWeek`, `countByField`, `groupBySourceAndType` in aggregate.js — Pattern for new groupByCategory utility
- `normalizeSource()` in sourceMappings.js — Already used for source filter options

### Established Patterns
- Clickable charts: Bar/Area onClick passes entry to a handler in App.jsx that opens the modal with filtered signals
- Filter state: per-tab useState in App.jsx (churnFilter, enrollmentFilter) — new calendar filter replaces these
- Inline styles with Compass tokens throughout — no exceptions

### Integration Points
- `SignalModal.jsx` wires into App.jsx replacing all `drawerOpen`/`drawerSignals`/`drawerTitle` state
- Browse tab time granularity state lives inside BrowseTab.jsx (self-contained)
- Browse filter state (source, severity, type, confidence) also lives inside BrowseTab.jsx
- Pipeline tab is a new standalone component wired into TABS array in App.jsx

</code_context>

<specifics>
## Specific Ideas

- Modal should show "3 of 12 signals" position indicator — CSMs want to know where they are in the list
- Category breakdown makes the "Upsell Signals" concept concrete — currently shows 0 because it's actually enrollment signals with category='enrollment_upsell_opportunity'
- Active/Churned badge is a triage tool — CSMs need to prioritize active-but-at-risk over already-churned accounts at a glance
- The Pipeline tab restores the Posts vs Signals chart that was removed from the main Churn/E&U view because the ratio looked bad — it belongs in a dedicated health tab, not the signal analysis view

</specifics>

<deferred>
## Deferred Ideas

- Claude AI chat integration — Phase 04
- Org-centric signal history page (click org name → see all org signals over time) — future phase
- Daily Slack/email digest — future phase
- "Mark Actioned" write-back to Supabase — future phase
- Export to CSV — future phase
- Keyboard navigation (arrow keys in modal list) — future phase
- Source filter on posts section of Browse — pending data quality verification

</deferred>

---

*Phase: 03-claude-ai-analysis*
*Context gathered: 2026-04-30*
