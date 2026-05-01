# Phase 05: Claude AI Analysis - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 05-claude-ai-analysis
**Areas discussed:** AI entry point, Feature scope, Data sent to Claude, Response UX, AI analysis scope

---

## AI Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| New 'AI Insights' tab | 5th top-level tab with chat input + auto analysis panel | ✓ |
| Panel on Churn/E&U tabs | Expandable AI section at bottom of existing tabs | |
| Button in signal modal | Per-signal "Analyze with AI" button inside the modal | |

**User's choice:** New AI Insights tab
**Notes:** Keeps AI isolated from existing tabs; CSMs go there deliberately

---

## Feature Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Auto analysis on load | Claude runs automatically when tab opens | ✓ |
| Free-form Q&A chat | Text input for asking questions | |
| Urgent signal flagging | Claude highlights top 3-5 urgent signals | |
| Weekly summary digest | Formatted recap for Slack/Confluence | |

**User's choice:** Auto analysis on load only
**Notes:** Focused scope — ship the highest-value feature first, defer chat/flagging/digest to Phase 06

---

## Data Sent to Claude

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-aggregated summary | Counts, rates, top sources/categories — no raw rows | ✓ |
| Full signal list (filtered) | All signal rows with all fields | |
| Top 20 signals + summary | Summary plus 20 most recent/severe signals | |

**User's choice:** Pre-aggregated summary
**Notes:** Cost-efficient, no token limit risk, sufficient for pattern analysis

---

## Response UX

| Option | Description | Selected |
|--------|-------------|----------|
| Streaming | Text appears token by token as Claude responds | |
| Full response on load | Spinner → full response at once | ✓ |

**User's choice:** Full response on load
**Notes:** Simpler to implement; streaming deferred to future phase if wait feels too long

---

## AI Analysis Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All signals combined | Churn + E&U together — full pipeline picture | ✓ |
| Churn signals only | Focus on highest-stakes signals | |
| User picks (toggle) | CSM selects Churn or E&U before Claude runs | |

**User's choice:** All signals combined
**Notes:** AI tab is standalone — covering the full pipeline makes sense since it's not scoped to a single tab

---

## Claude's Discretion

- Exact system prompt wording and structure
- Error handling for Claude API failures
- Whether to cache analysis result in component state
- Loading spinner style/animation

## Deferred Ideas

- Free-form Q&A chat → Phase 06
- Urgent signal flagging → Phase 06
- Weekly summary digest → Phase 06
- Per-signal AI button in signal modal → Phase 06
- Streaming response → deferred, can add later
