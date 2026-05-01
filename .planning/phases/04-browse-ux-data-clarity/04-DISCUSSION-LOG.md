# Phase 04: Browse UX & Data Clarity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 04-browse-ux-data-clarity
**Areas discussed:** Phase scope, Browse scroll bounds, Matched/Unmatched filter, Phase 03 gap items, Posts pipeline delay

---

## Phase Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Browse UX + matched/unmatched | Collapsible/scrollable sections, matched vs unmatched split | ✓ |
| Matched/unmatched only | Focused solo phase on match filter | |
| Something else | Free text | |

**User's choice:** Browse UX + matched/unmatched
**Notes:** Patrick explicitly deferred Claude AI Analysis: "I want to make sure the AI agent is completely the last thing we work on. I want to make sure this is bulletproof without an AI agent, and that'll just be the cherry on top, so let's push that back as far as we can." Phase 05 is reserved for Claude AI Analysis.

---

## Browse Scroll Bounds

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed height + scroll | 400px max-height with overflow scroll | ✓ |
| Collapsible accordion | Collapse/expand toggle on section headers | |
| Both | Scroll + collapse toggle | |

**User's choice:** Fixed height + scroll, 400px

---

## Matched / Unmatched Filter

| Option | Description | Selected |
|--------|-------------|----------|
| Filter tabs on signal lists | All / Matched / Unmatched tabs above each list | ✓ |
| Stat card + badge only | Count cards + badge on each signal card | |
| Separate sections | Matched above, Unmatched below with divider | |

**User's choice:** Filter tabs on signal lists
**Scope:** Churn tab, E&U tab, Browse tab signals (all three)

---

## Phase 03 Gap Items

| Option | Description | Selected |
|--------|-------------|----------|
| Signal Volume chart on Today/Yesterday | Hide chart / show stat for sub-7-day | ✓ |
| Posts Ingested = 0 note | Add delay explanation to stat card | ✓ |
| Skip these | Keep Phase 04 tight | |

**Notes:** Patrick confirmed both gaps should be included. On the Posts Ingested issue, Patrick noted: "We're always going to be a day later because we're working with the team in India" — confirmed this is a permanent pipeline characteristic (India scraping team), not a transient bug. Chose "Updated daily through yesterday" note as the fix.

---

## Phase Rename

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to 'Browse UX & Data Clarity' | Update ROADMAP.md and directory | ✓ |
| Rename to something else | Free text | |
| Keep 'Claude AI Analysis' | Leave as-is | |

**User's choice:** Rename to Browse UX & Data Clarity
**Action taken:** Directory renamed from `04-claude-ai-analysis` to `04-browse-ux-data-clarity`. ROADMAP.md updated. Claude AI Analysis moved to Phase 05.

---

## Claude's Discretion

- Exact visual treatment for collapsed chart (fade, display:none, height:0)
- Whether match filter tabs render as pills or segmented button
- Whether 400px scroll applies to Browse posts section too (applying both is fine)
