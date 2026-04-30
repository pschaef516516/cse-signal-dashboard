# Phase 03: Dashboard Polish & UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 03-dashboard-polish-ux
**Areas discussed:** Signal Navigator Modal, Browse Tab Redesign, Time Pills + Pipeline Tab, Category + Status Breakdowns

---

## Scope Decision

| Option | Selected |
|--------|----------|
| Phase 03 = Claude AI only (original roadmap) | |
| Phase 03 = UX polish first, AI becomes Phase 04 | ✓ |

**User's choice:** Defer AI to Phase 04 — "I wanna nail down the website before we start adding AI"

---

## Signal Navigator Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Modal goes straight to detail | Click → detail view directly, Prev/Next arrows | ✓ |
| Modal shows list first | Two-click flow like current drawer | |
| Modal shows list + detail side by side | Wide layout, both panels visible | |

**Size:** ~700px centered card (vs full screen, vs wide side panel) ✓

**Prev/Next:** Arrow buttons at top of modal with "3 of 12" position indicator ✓

**Close:** Backdrop click OR X button OR Escape ✓

**Browse context:** Prev/Next navigates all signals for the selected date/time period ✓

---

## Browse Tab Redesign

| Option | Description | Selected |
|--------|-------------|----------|
| Arrow nav for week/month | ‹ Prev / Next › buttons | |
| Dropdown / picker | Select specific week or month | ✓ |
| Date picker that snaps | Rounds to start of period | |

**Filters scope:** Signals only (posts don't have severity/confidence/type) ✓

**Filter UI:** Filter pills above the signals table, each opens a dropdown ✓

---

## Time Pills + Pipeline Tab

| Option | Description | Selected |
|--------|-------------|----------|
| Today / Yesterday / Last Week / Last Month / All | Calendar-anchored | |
| Today / Yesterday / Last 7d / Last 30d / All | Mixed | |
| Keep 7d/30d/90d + add Today/Yesterday | Additive | |

**User's choice:** Today \| Yesterday \| Week ↓ (dropdown picker) \| Month ↓ (dropdown picker) \| All

**Pipeline tab name:** "Pipeline" — scraper health + ingestion metrics ✓

**Tab order:** Churn / E&U / Browse / Pipeline ✓

---

## Category + Status Breakdowns

| Option | Description | Selected |
|--------|-------------|----------|
| New section per tab, below Signal Sources | Tab-specific category breakdown | ✓ |
| Inside signal modal only | Metadata field only | |
| Pipeline tab only | Combined breakdown | |

**Status badge:** Small colored pill next to org name (green = Active, red = Churned) ✓

**Category drill-down:** Clicking a category opens the Signal Navigator Modal filtered to that category ✓

---

## Claude's Discretion

- Modal animation/transition style
- Week/month dropdown picker implementation
- Filter pill dropdown positioning
- Pipeline tab time controls (or always all-time)
- Category chart type (horizontal bar, donut, vertical bar)
- Badge styling details within Compass tokens

## Deferred Ideas

- Claude AI integration — Phase 04
- Org history page, Slack digest, "Mark Actioned", CSV export — future phases
