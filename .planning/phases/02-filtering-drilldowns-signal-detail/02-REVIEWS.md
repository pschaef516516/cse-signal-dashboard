---
phase: 2
reviewers: [codex]
reviewed_at: 2026-04-30T00:00:00Z
plans_reviewed: [02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md, 02-05-PLAN.md]
---

# Cross-AI Plan Review — Phase 02

## Codex Review

## Cross-Plan Finding

The phase plans do **not** cover the new Browse tab scope at all, even though it is explicitly in the phase boundary and decisions `D-15` through `D-20` in CONTEXT.md. Current app state also still hardcodes only two tabs in `src/App.jsx`, and current post fetching only selects `captured_date,source` in `src/api/supabase.js`, which is insufficient for Browse posts (org name, content preview). That is the primary planning gap.

## 02-01-PLAN.md

**Summary**
Strong foundation plan for utility-first work, but it under-scopes the data layer by ignoring the Browse-tab fetch requirements called out in context and uses date-filter tests that are likely to be time-sensitive.

**Strengths**
- Good sequencing: pure utilities first, then downstream consumers.
- Correctly identifies `getISOWeekLabel` export as needed for week drill-down consistency.
- Includes tests for core aggregation additions.

**Concerns**
- `HIGH:` It does not add `fetchSignalsByDate(date)` / `fetchPostsByDate(date)` despite those being called out in context for Browse.
- `HIGH:` It does not expand post fields beyond `captured_date,source`, but Browse needs org name and content preview; current fetch is too thin.
- `MEDIUM:` `filterByDateRange` tests rely on real current time and may be flaky around midnight/timezone boundaries.
- `MEDIUM:` The cutoff logic is underspecified for date-only fields like `captured_date`.

**Suggestions**
- Add Browse-specific data tasks here: `fetchSignalsByDate`, `fetchPostsByDate`, and required post columns.
- Freeze time in tests with Vitest fake timers.
- Define date semantics explicitly: inclusive cutoff, local vs UTC, and date-only handling.

**Risk Assessment**
`MEDIUM` — utility work is solid, but the plan leaves required data-access surface unimplemented.

---

## 02-02-PLAN.md

**Summary**
Reasonable presentational split, but narrowly scoped to drawer/filter UI with nothing for Browse-tab UI even though Browse is part of the phase.

**Strengths**
- Clean prop contracts.
- Keeps state out of leaf components.
- Drawer behavior well specified and addresses backdrop click risk.

**Concerns**
- `HIGH:` No components for Browse tab: no date picker, no raw signals table, no raw posts table, no Browse empty states.
- `MEDIUM:` Hardcoded file content makes implementation brittle.
- `LOW:` No component-level verification for click behavior or rendering of missing-field states.

**Suggestions**
- Add Browse components here or create a dedicated Browse UI plan.
- Add at least one test for drawer open/closed rendering and empty states.

**Risk Assessment**
`MEDIUM` — scoped UI work is fine, but phase completeness is not.

---

## 02-03-PLAN.md

**Summary**
Good chart-focused plan, but may underdeliver on E&U drill-down coverage.

**Strengths**
- Backward-compatible `onBarClick` pattern is good.
- Reuses existing chart idioms instead of adding libraries.
- Separates enrichment charts from wiring.

**Concerns**
- `HIGH:` `EUCommunityChart` is explicitly non-clickable, but D-05 says the community chart is a drill-down target. Replacing CommunityChart on E&U without preserving click behavior likely drops required drill-down capability.
- `MEDIUM:` No automated verification of click payload shape.
- `LOW:` Acceptance criteria are grep-heavy and don't validate rendered behavior.

**Suggestions**
- Clarify whether E&U's source chart must also open the drawer; if yes, add `onBarClick` to `EUCommunityChart`.
- Add a lightweight component test for bar click callbacks.

**Risk Assessment**
`MEDIUM` — chart work is coherent but E&U drill-down behavior is underspecified.

---

## 02-04-PLAN.md

**Summary**
Most important integration plan — currently misses Browse tab entirely and has two D-02 violations in the non-Browse scope.

**Strengths**
- Correctly centralizes filter and drawer state in App.jsx.
- Good use of helper functions for drawer open/close and week filtering.
- Properly removes TopOrgsTable.

**Concerns**
- `HIGH:` Browse tab entirely absent — no third tab, no date picker, no raw lists, no Browse drawer reuse.
- `HIGH:` `uniqueOrgs` is computed from all `signals` in App.jsx (not filtered), violating D-02.
- `HIGH:` `PostsVsSignalsChart` receives unfiltered `signals` and `posts` — violates D-02 (all visible charts must update with filter).
- `MEDIUM:` Drawer title spec says "Week of [date]" but implementation uses ISO week label text.

**Suggestions**
- Add Browse tab integration (new plan or extend this plan).
- Update `uniqueOrgs` to use filtered rows, not all `signals`.
- Filter inputs to `PostsVsSignalsChart` as well, or explicitly revise if that chart is intentionally all-time.
- Add explicit changes to `TABS` array in App.jsx.

**Risk Assessment**
`HIGH` — plan currently cannot satisfy stated phase requirements.

---

## 02-05-PLAN.md

**Summary**
Useful human checkpoint but validates only the partial feature set and completely omits Browse verification.

**Strengths**
- Good end-to-end interaction focus.
- Catches drawer reset and backdrop issues.
- Appropriate as a blocking gate after implementation.

**Concerns**
- `HIGH:` No verification steps for D-15 through D-20 — Browse is missing from the checklist entirely.
- `MEDIUM:` Assumes Posts Ingested non-zero under 7d filter — dataset-dependent.
- `LOW:` Relies heavily on manual observation.

**Suggestions**
- Add Browse checks: third tab visible, default yesterday, date change updates both sections, signal row opens drawer, posts are non-clickable, empty states work.
- Rephrase dataset-sensitive checks as "changes consistently" not "non-zero".

**Risk Assessment**
`MEDIUM` — reasonable gate for the implemented subset, but cannot certify full phase completion.

---

## Consensus Summary

### Agreed Strengths
- Utility-first sequencing (Plan 01 → 02 → 03 → 04) is sound
- Backward-compatible `onBarClick` pattern on charts is well designed
- Keeping all state in App.jsx (no Redux/context) is consistent with the project pattern

### Agreed Concerns (Highest Priority)
1. **[HIGH] Browse tab (D-15–D-20) has zero plan coverage** — no data fetch, no UI components, no App.jsx integration, no verification steps
2. **[HIGH] D-02 violations in Plan 04** — `uniqueOrgs` and `PostsVsSignalsChart` use unfiltered data; both must update with the time period filter
3. **[HIGH] Missing Supabase functions for Browse** — `fetchSignalsByDate(date)` and `fetchPostsByDate(date)` not in any plan; posts fetch missing org name + content preview columns
4. **[MEDIUM] E&U community chart drill-down ambiguity** — `EUCommunityChart` marked non-clickable but D-05 may require it to be clickable

### Divergent Views
- None (single reviewer)
