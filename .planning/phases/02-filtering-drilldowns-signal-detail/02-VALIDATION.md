---
phase: 2
slug: filtering-drilldowns-signal-detail
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | — | — | N/A | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | — | — | N/A | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 2 | — | — | N/A | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 2 | — | — | N/A | unit | `npm run test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/filterByDateRange.test.ts` — unit tests for date range filtering including `dateField` param
- [ ] `src/__tests__/TimePeriodFilter.test.tsx` — pill selection and state update
- [ ] `src/__tests__/SignalDetailDrawer.test.tsx` — open/close, pointer-events behavior

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart bar click opens correct drawer | UI drill-down | DOM event simulation impractical in vitest for Recharts canvas | Click a bar → verify drawer title matches bar label |
| Drawer backdrop pointer-events when closed | Usability | CSS property not inspectable via vitest | Close drawer → click chart → verify drawer does not re-open from backdrop |
| Time filter pill updates all visible stats | Cross-component state | Multi-component integration | Select 7d pill → verify stat cards, charts, and E&U tab all update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
