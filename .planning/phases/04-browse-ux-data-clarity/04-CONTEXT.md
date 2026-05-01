# Phase 04: Browse UX & Data Clarity - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the two biggest UX gaps left after Phase 03 and fold in two polish items from the Phase 03 UAT backlog:

1. **Browse tab scroll bounds** — Signals and posts sections grow infinitely. Cap each at 400px with overflow-y scroll.
2. **Matched / Unmatched signal filter** — CSMs take different follow-up actions on matched signals (org found) vs unmatched (org not found). Add All / Matched / Unmatched filter tabs to the Churn, E&U, and Browse tab signal lists.
3. **Signal Volume chart on sub-7-day filters** — When Today or Yesterday is selected, the area chart renders a single isolated dot (one data point), which looks broken. Hide the chart and show a simple stat instead for periods under 7 days.
4. **Posts Ingested pipeline delay note** — Posts are always ingested 1 day behind because the scraping team is in India. The Posts Ingested stat card shows 0 on Today. Add a subtext note: "Updated daily through yesterday".

This phase does NOT add Claude AI / LLM integration (deferred to Phase 05).

</domain>

<decisions>
## Implementation Decisions

### Browse Tab Scroll Bounds
- **D-01:** Signals section in the Browse tab gets a fixed max-height of 400px with `overflow-y: auto`. Posts section gets the same treatment. Each section scrolls independently.
- **D-02:** The 400px height applies to the list/table container itself — not the entire section panel including the header row.

### Matched / Unmatched Filter
- **D-03:** Add All / Matched / Unmatched filter tabs (pill-style, consistent with existing filter patterns) above the signal list on: Churn tab, Enrollment & Upsell tab, and Browse tab signals section.
- **D-04:** "Matched" = signals where `match_method` is NOT `'not_found'`. "Unmatched" = signals where `match_method === 'not_found'`. "All" shows everything (default).
- **D-05:** The match filter is independent of existing filters (source, category, time period). All filters combine with AND logic.

### Signal Volume Chart — Sub-7-day Periods
- **D-06:** When the selected time filter is Today or Yesterday (periods shorter than 7 days), hide the Signal Volume area chart and replace it with a simple stat display showing total signal count for the period. The chart is only meaningful at week+ granularity.
- **D-07:** The replacement stat should be inline/minimal — not a full stat card, just a number with a label like "12 signals today". The chart container space can collapse or show the stat centered in its place.

### Posts Ingested Pipeline Delay
- **D-08:** Add a subtext note below the Posts Ingested stat card value reading: "Updated daily through yesterday". This applies on all time filter selections — it's always true, not just on Today.
- **D-09:** Note styling: same small muted text used for other stat card subtitles (`fontSize: 12, color: '#6B7487'`).

### Claude's Discretion
- Exact visual treatment for the collapsed chart (fade out, display: none, height: 0)
- Whether to show the match filter tabs as pills or as a segmented button control
- Whether the 400px scroll applies to the posts section in Browse too, or just signals (applying to both is fine)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `src/components/ui/BrowseTab.jsx` — Add scroll bounds to signals and posts containers; add match filter tabs to signals section
- `src/App.jsx` — Add match filter state for Churn and E&U tabs; wire to signal list filtering
- `src/components/charts/SignalVolumeChart.jsx` (or wherever the area chart lives) — Add sub-7-day guard to hide chart and show stat
- `src/components/ui/PipelineTab.jsx` — Add delay note to Posts Ingested BigStat sub text
- `src/components/ui/FilterPills.jsx` or inline in App.jsx — May need a match filter pill component or simple tab row

### Design tokens (Compass — inline styles only, no Tailwind)
- Background: `#FAFBFF`, Primary: `#0057FF`, Border: `#E1E6F2`, Text: `#15181D`
- Muted: `#6B7487`, Danger/churn: `#D81860`, Success: `#00A344`

### Project constraints
- `.planning/PROJECT.md` — Inline styles only, useState only, Supabase REST, Vercel deploy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BrowseFilterPill.jsx` — Existing filter pill component with click-outside dropdown; match filter tabs may reuse this pattern or be simpler (just tabs, no dropdown)
- `FilterPills.jsx` — Existing time filter pills on Churn/E&U tabs; match filter is a separate row of tabs above the signal list
- `BigStat` component in `PipelineTab.jsx` — Already accepts a `sub` prop for subtext; D-08 is just updating the `sub` string
- `groupByWeek`, `filterByRange` in `aggregate.js` / `dateRanges.js` — Used for Signal Volume chart data; sub-7-day check can use the same `filterByRange` output

### Established Patterns
- Match method filtering: `match_method !== 'not_found'` for matched, `match_method === 'not_found'` for unmatched — already used in `MatchRateChart.jsx`
- Filter state: per-tab `useState` in `App.jsx`; match filter follows same pattern
- Clickable filter UI: pill rows with active/inactive states already exist on Churn/E&U tabs

### Integration Points
- `App.jsx` passes filtered signal arrays to tab components; match filter state lives in App.jsx and pre-filters before passing down
- Browse tab receives `displayedSignals` from App.jsx; match filter on Browse may be internal to `BrowseTab.jsx` since Browse manages its own signal state

</code_context>

<specifics>
## Specific Ideas

- Posts are ingested 1 day behind because the India scraping team runs on their schedule — this is a permanent pipeline characteristic, not a bug. The "Updated daily through yesterday" note should be permanent subtext on the Posts Ingested stat card, not just for Today.
- The Signal Volume chart showing a single dot on Today/Yesterday is technically correct but visually broken. The fix is to hide it and show a count instead — not to try to make a 1-point chart look good.

</specifics>

<deferred>
## Deferred Ideas

- **Claude AI Analysis** — Phase 05. Fully deferred; Patrick wants the dashboard bulletproof before adding AI. Phase 05 will cover: CSM question-answering, pattern detection, urgent signal flagging, weekly summaries. Local dev: .env.local API key. Production: Vercel serverless function to protect the key.
- **StatusBadge live verification** — The Active/Churned badge fix (Phase 03) was deployed but not tested with signals that have a known `customer_status` value. Worth a quick check when live data permits.
- **Browse collapsible sections** — Patrick asked about collapsible accordion-style sections during Phase 03 UAT. D-01 resolves this with fixed-height scroll. No separate collapse toggle needed unless scroll alone isn't enough after testing.

</deferred>

---

*Phase: 04-browse-ux-data-clarity*
*Context gathered: 2026-04-30*
