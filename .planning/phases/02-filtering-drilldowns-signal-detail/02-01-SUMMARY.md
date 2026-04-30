---
phase: "02"
plan: "01"
subsystem: "data-layer"
tags: [utilities, aggregation, supabase, tdd, date-filtering]
dependency_graph:
  requires: []
  provides:
    - filterByDateRange (src/utils/aggregate.js)
    - groupBySourceAndType (src/utils/aggregate.js)
    - getISOWeekLabel exported (src/utils/aggregate.js)
    - fetchSignals with detail columns (src/api/supabase.js)
    - fetchPosts with org_name+content (src/api/supabase.js)
    - fetchSignalsByDate (src/api/supabase.js)
    - fetchPostsByDate (src/api/supabase.js)
  affects:
    - Plan 02-02 (time filter pills consume filterByDateRange)
    - Plan 02-03 (drill-down drawer consumes signal detail columns)
    - Plan 02-04 (E&U tab consumes groupBySourceAndType)
    - Plan 02-05 (Browse tab consumes fetchSignalsByDate, fetchPostsByDate)
tech_stack:
  added: []
  patterns:
    - TDD with Vitest fake timers (vi.useFakeTimers) for deterministic date tests
    - Immutable spread operator in groupBySourceAndType accumulator
    - PostgREST gte/lte date range filtering for fetchSignalsByDate
    - PostgREST eq filter on date-only column for fetchPostsByDate
key_files:
  created: []
  modified:
    - src/utils/aggregate.js
    - tests/utils/aggregate.test.js
    - src/api/supabase.js
decisions:
  - "getISOWeekLabel promoted from private function to named export — required by week-based drill-down in Plan 02-03"
  - "filterByDateRange uses days=null as passthrough (returns all rows), consistent with All time period option"
  - "fetchSignalsByDate uses gte/lte on created_at ISO timestamps (UTC boundary acceptable for internal tool)"
  - "fetchPostsByDate uses captured_date=eq since posts column is date-only, not a timestamp"
metrics:
  duration: "110s"
  completed_date: "2026-04-30"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 02 Plan 01: Data-Layer Foundation Summary

**One-liner:** Pure utility and API primitives for Phase 02 — date-range filter, E&U source aggregation, ISO week label export, and Supabase column expansions with Browse tab fetch helpers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add filterByDateRange, groupBySourceAndType, export getISOWeekLabel (TDD) | 6f74c1f | src/utils/aggregate.js, tests/utils/aggregate.test.js |
| 2 | Expand fetchSignals/fetchPosts columns, add fetchSignalsByDate/fetchPostsByDate | 6e54220 | src/api/supabase.js |

## What Was Built

### Task 1 — aggregate.js (TDD: RED then GREEN)

Three new named exports added to `src/utils/aggregate.js`:

- **`filterByDateRange(rows, days, dateField = 'created_at')`** — returns all rows when `days` is null/falsy (the "All" filter state), otherwise keeps rows whose `dateField` timestamp falls within the last N days. Rows with unparseable date strings are skipped via `isNaN` guard.
- **`groupBySourceAndType(rows)`** — accumulates enrollment and upsell counts per source, ignores churn signals and rows missing source or signal_type, returns array sorted by total (enrollment + upsell) descending.
- **`getISOWeekLabel(date)`** — existing private function promoted to a named export (body unchanged). Required so downstream plans can import it for week-based drill-down labels.

11 new test cases written with `vi.useFakeTimers()` (frozen to 2026-06-15T12:00:00Z) ensuring deterministic behavior regardless of when tests run. All 32 tests pass (21 pre-existing + 11 new).

### Task 2 — supabase.js

- **`fetchSignals`** select string expanded to include `key_quote,summary,suggested_action` for the SignalDetail drawer (D-08).
- **`fetchPosts`** select string expanded to include `id,org_name,content` so the Browse tab can render org name column and 120-char content preview (D-19). Pagination loop unchanged.
- **`fetchSignalsByDate(date)`** — new export for Browse tab. Accepts a "YYYY-MM-DD" string, filters via PostgREST `created_at=gte.{date}T00:00:00&created_at=lte.{date}T23:59:59`. Returns empty array if date is falsy.
- **`fetchPostsByDate(date)`** — new export for Browse tab. Accepts a "YYYY-MM-DD" string, filters via PostgREST `captured_date=eq.{date}` (posts use a date-only column). Returns empty array if date is falsy.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functions are fully implemented with real logic. No hardcoded empty values or placeholders.

## Threat Flags

T-02-13 (injection in date param) is noted in the plan's threat model with `mitigate` disposition. The mitigation (regex guard on the date string) is assigned to Plan 05 (Browse tab date picker). No new unplanned threat surface was introduced in this plan.

## Self-Check: PASSED

- `src/utils/aggregate.js` exists and exports 8 named functions: FOUND
- `tests/utils/aggregate.test.js` exists with 32 tests: FOUND
- `src/api/supabase.js` exists with all 4 exports: FOUND
- Commit 6f74c1f exists: FOUND
- Commit 6e54220 exists: FOUND
- `npm test` exits 0 (32/32 tests pass): CONFIRMED
- `npm run build` exits 0: CONFIRMED
