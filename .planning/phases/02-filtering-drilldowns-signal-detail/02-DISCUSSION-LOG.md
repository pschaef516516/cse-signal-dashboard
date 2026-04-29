# Phase 02: Filtering, Drill-downs & Signal Detail - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 02-filtering-drilldowns-signal-detail
**Areas discussed:** Time filter scope & placement, Drill-down interaction pattern, Signal detail view & Supabase fields, Enrollment & Upsell tab enrichment

---

## Time Filter Scope & Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Header bar next to tabs | Filter sits in the tab bar row next to Churn / Enrollment & Upsell | ✓ |
| Controls bar below the header | Dedicated pill row just above content area | |
| You decide | Claude picks placement | |

**User's choice:** Header bar next to tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Global — everything on the tab | Stat cards + all charts update together | ✓ |
| Charts only — stat cards stay all-time | Stat cards always show all-time totals | |
| You decide | Claude picks | |

**User's choice:** Global — everything on the tab

| Option | Description | Selected |
|--------|-------------|----------|
| Per-tab — each tab has its own filter | Switching tabs preserves filter state | ✓ |
| Shared — one filter controls both tabs | One filter updates both tabs | |
| You decide | Claude picks | |

**User's choice:** Per-tab — each tab has its own filter

---

## Drill-down Interaction Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Side panel / drawer slides in | Panel from right, chart stays visible | ✓ |
| Inline list expands below the chart | List below clicked element | |
| Full filtered page view | Replaces dashboard with signal list | |

**User's choice:** Side panel / drawer slides in

**Clickable charts selected:**
- Community chart (by source) ✓
- Signal volume chart (by week) ✓
- Severity chart ✓
- Top orgs table — NOT selected

| Option | Description | Selected |
|--------|-------------|----------|
| Signal card with key fields | org name, source, severity, confidence, match method, date | ✓ |
| Dense table rows | Compact table format | |
| You decide | Claude picks | |

**User's choice:** Signal card with key fields

| Option | Description | Selected |
|--------|-------------|----------|
| Click outside to close | Backdrop click closes panel | ✓ |
| Explicit close button only | X button required | |
| Both | Backdrop + X button | |

**User's choice:** Click outside to close

---

## Signal Detail View & Supabase Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — all three exist | key_quote, summary, suggested_action in signals table | ✓ |
| Some exist, some don't | Partial | |
| Not sure | Need to verify schema | |

**User's choice:** Yes — all three exist in the signals table

| Option | Description | Selected |
|--------|-------------|----------|
| Expands within the drill-down panel | Replaces list, back button returns | ✓ |
| Opens a second/nested panel | Second panel stacks on right | |
| Opens a modal overlay | Centered modal | |

**User's choice:** Expands within the drill-down panel

| Option | Description | Selected |
|--------|-------------|----------|
| All signal metadata + the three fields | Org, source, type, severity, confidence, match method, date + key_quote + summary + suggested_action | ✓ |
| Just the three core fields | key_quote, summary, suggested_action only | |
| You decide | Claude picks | |

**User's choice:** All signal metadata + the three fields

| Option | Description | Selected |
|--------|-------------|----------|
| Back button only | Return to the list | ✓ |
| Prev/Next arrows | Step through signals | |
| You decide | Claude picks | |

**User's choice:** Back button only

---

## Enrollment & Upsell Tab Enrichment

**Selected enrichment options:**
- Source breakdown specific to E&U ✓

**User notes:** Top orgs breakdown is not that useful for E&U because most orgs in the E&U pipeline are small companies with one main person in the community. The same applies to the Churn tab — org-level breakdown is not that actionable across the board.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — enrollment vs upsell split | Separate stat cards + split chart | ✓ |
| No — treat enrollment and upsell together | Keep combined | |
| You decide | Claude picks | |

**User's choice:** Yes — show enrollment vs upsell as separate stat cards and a split chart

| Option | Description | Selected |
|--------|-------------|----------|
| Replace top orgs with source trend chart | Trending communities over time | |
| Remove top orgs from E&U tab entirely | Less clutter | |
| Leave it empty for now | ✓ | |

**User's choice:** Leave it empty for now — Top Orgs removed from BOTH tabs, space unused until Phase 3

---

## Claude's Discretion

- Exact drawer width and animation style
- Visual treatment of time filter pill buttons (active state within Compass tokens)
- Empty state handling in the drill-down panel
- How Posts Ingested stat card handles time filtering (posts use captured_date, signals use created_at)

## Deferred Ideas

None — discussion stayed within phase scope.
