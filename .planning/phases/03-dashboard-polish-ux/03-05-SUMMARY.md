---
phase: 03-dashboard-polish-ux
plan: "05"
subsystem: frontend
tags: [category-chart, status-badge, stat-card, recharts, signal-modal]
dependency_graph:
  requires:
    - 03-01  # SignalModal and openModal handler already in App.jsx
    - 03-04  # isPipeline guard already in App.jsx
  provides:
    - CategoryBreakdownChart component
    - StatusBadge on SignalCard
    - handleCategoryClick opening modal filtered by category
    - % Preventable Churn stat card on Churn tab
  affects:
    - src/components/charts/CategoryBreakdownChart.jsx
    - src/components/ui/SignalCard.jsx
    - src/App.jsx
tech_stack:
  added: []
  patterns:
    - Recharts BarChart layout="vertical" with Cell color array (matches CommunityChart pattern)
    - formatCategory strips churn_/enrollment_ prefix and converts to Title Case
    - StatusBadge priority chain: status || customer_status || churn_date fallback
    - preventablePct derivation alongside existing matchRate / highSeverity derivations
key_files:
  created:
    - src/components/charts/CategoryBreakdownChart.jsx
  modified:
    - src/components/ui/SignalCard.jsx
    - src/App.jsx
decisions:
  - "CategoryBreakdownChart slices to top 10 categories to keep chart readable (T-03-05-03 accepted)"
  - "chartHeight computed dynamically: max(200, data.length * 48 + 40) — scales with category count"
  - "StatusBadge returns null when both status fields are null AND churn_date is absent — no empty pill rendered"
  - "Signal Categories section placed after Sources, before Match & Quality — matches D-15"
  - "% Preventable Churn StatCard rendered only when isChurn is true — consistent with Enrollment/Upsell StatCards pattern"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-30"
  tasks_completed: 2
  files_modified: 2
  files_created: 1
---

# Phase 03 Plan 05: Category & Status Breakdowns Summary

## One-liner

Clickable Signal Categories horizontal bar chart on Churn and E&U tabs, Active/Churned status badge on every signal card, and a % Preventable Churn stat card on the Churn tab — all wired to the existing SignalModal and Supabase data.

## What Was Built

### CategoryBreakdownChart.jsx (new)

A horizontal bar chart that computes signal counts by the `category` field using the existing `countByField(signals, 'category')` utility from aggregate.js. Key details:

- Layout: `layout="vertical"` with `YAxis tickFormatter={formatCategory}` — same vertical bar pattern as CommunityChart.jsx
- `formatCategory()` strips `churn_` or `enrollment_` prefix then converts snake_case to Title Case. Examples: `churn_price_complaint` → "Price Complaint", `enrollment_upsell_opportunity` → "Upsell Opportunity"
- Sliced to top 10 categories to cap render cost (T-03-05-03)
- Dynamic height: `Math.max(200, data.length * 48 + 40)` so all bars are visible without fixed scroll
- `onBarClick` prop: if provided, sets `cursor: pointer` on BarChart and attaches `onClick={(entry) => onBarClick(entry.name)}` on Bar — identical to CommunityChart pattern
- Returns an empty state paragraph if no category data is available
- COLORS: `['#0057FF', '#3378FF', '#6699FF', '#99BBFF', '#B2CDFF']` — blue gradient using Compass primary

### StatusBadge in SignalCard.jsx

A `StatusBadge` function component added above the `SignalCard` export. Priority chain:

1. `signal.status` — if present, check `raw.toLowerCase().includes('churn')` or `=== 'active'`
2. `signal.customer_status` — fallback if `status` is null/empty
3. `signal.churn_date` — final fallback: truthy churn_date → Churned, null/absent → Active

Badge renders as a pill span inline next to the org name. The org name `<p>` was updated to `display: flex` so the badge sits on the same line.

Colors: red (`#D81860` / `#FDE8EF` background) for Churned, green (`#00A344` / `#E6F7EE` background) for Active — both are Compass tokens per the design system.

Returns `null` when all three fields are absent — no empty pill is ever rendered.

### App.jsx changes

Four targeted additions, no other sections touched:

1. **Import:** `import CategoryBreakdownChart from './components/charts/CategoryBreakdownChart'`
2. **preventablePct derivation:** `preventableCount` filters `tabSignals` by `s.preventability === 'high'`; `preventablePct` is the percentage, 0 if no signals
3. **handleCategoryClick:** Filters `tabSignals` by `s.category === category`, then calls `openModal(filtered, 0)` — same pattern as `handleCommunityClick` and `handleSeverityClick`
4. **Signal Categories JSX section:** After Sources, before Match & Quality, inside the `!isBrowse && !isPipeline` guard. Both Churn and E&U tabs show it with tab-appropriate subtitle
5. **% Preventable Churn StatCard:** Added inside `{isChurn && (...)}` guard alongside the existing `{!isChurn && (...)}` enrollment stat cards

## Actual Field Values (live data — assumption status from RESEARCH.md)

The RESEARCH.md (A2, A3) flagged these as LOW confidence assumptions to verify with live data:

- **signal.status / signal.customer_status values:** The badge logic handles any string containing "churn" as Churned and exact "active" as Active. If these columns store values like "cancelled", "inactive", or "prospect", those signals will render no badge (StatusBadge returns null). The badge will show correctly for the common case of "active" / "churned" strings.
- **preventability column:** The stat card counts rows where `preventability === 'high'`. If the column stores "yes", "1", or is unpopulated, the stat card will show "0%" — it will not error. Verify in Supabase if 0% appears and seems wrong.
- **category field:** The `countByField` utility skips null/undefined values (confirmed in aggregate.js: `if (key == null) return acc`). If category is null for all signals, CategoryBreakdownChart renders the "No category data available." fallback — not an error.

## Category Name Formatting

`formatCategory` was tested mentally against known category values from the schema:

| Raw value | Formatted output |
|---|---|
| `churn_price_complaint` | Price Complaint |
| `churn_competitor_comparison` | Competitor Comparison |
| `enrollment_upsell_opportunity` | Upsell Opportunity |
| `null` | (filtered out by `.filter((d) => d.name != null)`) |

No formatting issues anticipated. The regex `replace(/^churn_|^enrollment_/, '')` correctly strips the type prefix, and title-casing via `replace(/\b\w/g, ...)` handles single-word and multi-word categories.

## Success Criteria

- [x] CategoryBreakdownChart.jsx exists and exports a default function
- [x] formatCategory strips type prefix and converts to Title Case
- [x] SignalCard.jsx has StatusBadge with priority chain: status || customer_status || churn_date fallback
- [x] App.jsx has handleCategoryClick calling openModal(filtered, 0)
- [x] Signal Categories section appears in both Churn and E&U tabs after Sources section
- [x] % Preventable Churn StatCard appears only on Churn tab
- [x] npm run build passes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All wiring is live: CategoryBreakdownChart reads from `tabSignals` (real Supabase data), StatusBadge reads from `signal.status`/`signal.customer_status`/`signal.churn_date` (all real signal columns fetched in Phase 01), and preventablePct reads from `tabSignals`.

The only uncertainty is whether live data populates these columns with the expected string values — documented above under "Actual Field Values."

## Threat Flags

None. The plan's threat register (T-03-05-01, T-03-05-02, T-03-05-03) was reviewed:
- Status field rendering: accepted — internal dashboard, known enum-like values
- Category field used as modal filter key: accepted — same trust level as all other Supabase fields, not used in queries
- CategoryBreakdownChart sliced at 10: accepted — .slice(0, 10) applied in implementation

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create CategoryBreakdownChart and add StatusBadge | aaeb383 | src/components/charts/CategoryBreakdownChart.jsx (new), src/components/ui/SignalCard.jsx |
| 2 | Add category sections, preventable churn stat, and click handler to App.jsx | 56190b6 | src/App.jsx |

## Self-Check: PASSED

- `src/components/charts/CategoryBreakdownChart.jsx` — FOUND
- `src/components/ui/SignalCard.jsx` — FOUND
- `src/App.jsx` — FOUND
- Commit `aaeb383` — FOUND in git log
- Commit `56190b6` — FOUND in git log
- npm run build — PASSED (597 modules, no errors, chunk size warning only)
