# Phase 02: Filtering, Drill-downs & Signal Detail - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Add interactivity to the existing static dashboard:
1. Time period filter (7d / 30d / 90d / All) on each tab
2. Clickable charts that open a right-side drawer showing filtered signals
3. Signal detail view (accessible from the drawer) showing key_quote, summary, and suggested_action
4. Enrollment & Upsell tab enriched with enrollment vs upsell split data
5. Top Orgs table removed from both tabs
6. Browse tab — see all raw signals and posts for a selected date (defaults to yesterday)

This phase does NOT add new data sources, routing/URLs, or AI analysis.

</domain>

<decisions>
## Implementation Decisions

### Time Period Filter
- **D-01:** Filter (7d / 30d / 90d / All) lives in the header bar in the same row as the Churn / Enrollment & Upsell tabs — not a separate controls bar
- **D-02:** Filter applies globally to everything visible on the active tab: all stat cards (Total Signals, Match Rate, Unique Orgs, High Severity, Posts Ingested) AND all charts update together
- **D-03:** Per-tab state — each tab remembers its own filter independently. Switching tabs does not reset or sync filters.

### Drill-down Interaction
- **D-04:** Clicking a chart element opens a side panel (drawer) that slides in from the right side of the screen
- **D-05:** Clickable charts: Community chart (by source), Signal volume chart (by week), Severity chart (by severity level). The Top Orgs table and Match Rate chart are NOT clickable drill-down targets.
- **D-06:** Drill-down panel shows signal cards with these fields: org name, source, severity, confidence score, match method, created date. Each card is clickable to open the detail view.
- **D-07:** Panel closes on click-outside (clicking the dimmed backdrop). No explicit close button required.

### Signal Detail View
- **D-08:** key_quote, summary, and suggested_action columns all exist in the Supabase signals table. Add them to the fetchSignals() select query.
- **D-09:** Detail view expands WITHIN the same drawer (replaces the signal list). A back button returns to the filtered signal list.
- **D-10:** Detail view layout: all signal metadata at top (org name, source, signal type, severity, confidence, match method, created date), then key_quote displayed as a highlighted quote block, summary as a paragraph, suggested_action as a styled callout/action card.
- **D-11:** Navigation: back button only. No prev/next arrow navigation between signals.

### Enrollment & Upsell Tab Enrichment
- **D-12:** Add source breakdown specific to E&U signals — which communities produce the most enrollment vs upsell signals (currently CommunityChart shows all signal types combined; E&U tab needs its own source view split by enrollment and upsell)
- **D-13:** Add enrollment vs upsell split: separate stat cards showing enrollment count and upsell count separately, plus a split/stacked chart showing each type's volume trend over time
- **D-14:** Remove Top Orgs table from BOTH Churn and Enrollment & Upsell tabs. Most orgs in the pipeline are small (one person in the community), so org-level breakdown is not actionable. Space left empty for now — Phase 3 AI analysis will fill it.

### Browse Tab (Raw Data Viewer)
- **D-15:** Add a third tab "Browse" (alongside Churn and Enrollment & Upsell). The Browse tab is a raw data viewer — not filtered by signal type.
- **D-16:** Browse tab has a date picker at the top (single date, default: yesterday). All content on the tab updates when the date changes.
- **D-17:** Two sections on the Browse tab: "Signals" (all signals captured on the selected date) and "Posts" (all posts captured on the selected date). Each section is a scrollable list/table.
- **D-18:** Signals list columns: org name, signal type, severity, source, confidence score, created date. Each row is clickable — opens the existing SignalDetail drawer (reuse the same drawer component from D-04 through D-11).
- **D-19:** Posts list columns: captured date, org name (if available), content preview (first 120 chars of post text). Posts are display-only, not clickable.
- **D-20:** If no signals or posts exist for the selected date, show an empty state message in each section ("No signals found for this date" / "No posts found for this date").

### Claude's Discretion
- Exact drawer width and animation style (suggest ~480px, slide from right)
- How to handle the "Posts Ingested" stat card under time filtering (posts table uses captured_date not created_at — implement date filter consistently or note the difference)
- Visual treatment of the filter pills in the header (active state styling within Compass design tokens)
- How to handle empty states in the drill-down panel (no signals match the filter)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Existing codebase files (agents must read before modifying)
- `src/api/supabase.js` — Supabase REST fetch logic; needs key_quote, summary, suggested_action added to fetchSignals(); also needs a fetchPostsByDate(date) and fetchSignalsByDate(date) function for Browse tab
- `src/utils/aggregate.js` — All aggregation utilities; needs a date-range filter utility added
- `src/App.jsx` — Main app state, tab logic, and layout; time filter state and drawer state live here
- `src/components/charts/SignalVolumeChart.jsx` — Recharts BarChart; needs onClick on Bar element
- `src/components/charts/CommunityChart.jsx` — Recharts horizontal BarChart; needs onClick on Cell/Bar
- `src/components/charts/SeverityChart.jsx` — Recharts chart; needs onClick support
- `src/components/charts/TopOrgsTable.jsx` — REMOVE from both tab layouts
- `.planning/PROJECT.md` — Project constraints (anon key only, client-side aggregation, Compass design tokens)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All chart components use Recharts `ResponsiveContainer` — adding `onClick` to `Bar` and `Cell` elements is native Recharts, no library change needed
- `groupByField`, `countByField`, `groupByWeek` in aggregate.js — will need a `filterByDateRange(rows, days)` utility added alongside these
- `StatCard`, `SectionHeader`, `Panel` (inline in App.jsx) — reuse for drawer content layout
- Compass design tokens already applied: `#FAFBFF` bg, `#0057FF` primary, `#E1E6F2` border, `#15181D` text

### Established Patterns
- State management: React `useState` only — no Redux, no context — add time filter state and drawer state as `useState` in App.jsx
- Styling: inline styles with Compass tokens (no Tailwind classes in chart components)
- Data fetching: all data fetched on mount, stored in state, filtered client-side — time filter is a client-side filter over `signals` state, not a new API call

### Integration Points
- Drawer component will be a new component (`src/components/ui/SignalDrawer.jsx`) wired into App.jsx
- Signal detail will be a new component (`src/components/ui/SignalDetail.jsx`) rendered inside SignalDrawer
- Time filter pill row added inside the existing header `<div>` in App.jsx, same row as tabs
- `fetchSignals()` in supabase.js needs `key_quote,summary,suggested_action` added to select string

</code_context>

<specifics>
## Specific Ideas

- User confirmed key_quote, summary, suggested_action all exist in Supabase — add to fetch immediately
- Top Orgs table removal is intentional and applies to BOTH tabs — small-org pipeline makes org breakdown not actionable
- The "Posts Ingested" stat card may need special handling under time filtering since posts use `captured_date` instead of `created_at`
- For E&U tab: the split should make it visually obvious how many signals are enrollment vs upsell (currently indistinguishable at a glance)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-filtering-drilldowns-signal-detail*
*Context gathered: 2026-04-29*
