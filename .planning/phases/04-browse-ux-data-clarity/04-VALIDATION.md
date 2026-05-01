---
phase: 04
slug: browse-ux-data-clarity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no automated test infrastructure in project |
| **Config file** | none |
| **Quick run command** | manual browser verification |
| **Full suite command** | manual browser verification |
| **Estimated runtime** | ~5 minutes manual |

No `jest.config.*`, `vitest.config.*`, `pytest.ini`, or `tests/` directory found. All verification is manual browser testing.

---

## Sampling Rate

- **After every task commit:** Manual browser smoke-test (see Per-Task map)
- **After every plan wave:** Full manual verification checklist
- **Before `/gsd-verify-work`:** All manual checks must pass

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Verification Steps | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 04-browse-scroll | TBD | 1 | D-01, D-02 | N/A | manual | Scroll signals and posts sections in Browse — lists scroll at 400px, headers stay fixed | ⬜ pending |
| 04-match-filter-app | TBD | 1 | D-03, D-04, D-05 | N/A | manual | Switch All/Matched/Unmatched on Churn/E&U — only signal list changes, stat cards unchanged | ⬜ pending |
| 04-match-filter-browse | TBD | 1 | D-03, D-04, D-05 | N/A | manual | Apply match filter in Browse, switch granularity tab — filter resets to All | ⬜ pending |
| 04-chart-guard | TBD | 1 | D-06, D-07 | N/A | manual | Select Today/Yesterday on Churn/E&U — chart hidden, count stat shown. Select Week/Month/All — chart visible | ⬜ pending |
| 04-pipeline-note | TBD | 1 | D-08, D-09 | N/A | manual | Open Pipeline tab — "Updated daily through yesterday" appears below Posts Ingested number | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Wave 0 Requirements

*No automated test infrastructure — Wave 0 not applicable.*
*Existing infrastructure covers all phase requirements via manual verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browse scroll bounds | D-01, D-02 | No DOM testing infra | Scroll signals and posts sections in Browse tab; confirm scroll at 400px, page does not grow |
| Match filter list isolation | D-03–D-05 | No automated UI tests | Switch All/Matched/Unmatched — confirm stat cards, charts unchanged, only signal list rows change |
| Match filter granularity reset | D-05 | No automated UI tests | In Browse tab, set filter to Matched, switch from Week to Month — confirm filter resets to All |
| Chart guard on Today/Yesterday | D-06, D-07 | No automated UI tests | Select Today filter — confirm area chart hidden, inline count shown. Select Week — chart visible |
| Posts Ingested delay note | D-08, D-09 | No automated UI tests | Open Pipeline tab — "Updated daily through yesterday" visible as subtext under Posts Ingested |

---

## Validation Sign-Off

- [ ] All manual verifications completed in browser
- [ ] No regressions on existing Churn/E&U/Browse/Pipeline functionality
- [ ] `nyquist_compliant: true` set in frontmatter after manual verification

**Approval:** pending
