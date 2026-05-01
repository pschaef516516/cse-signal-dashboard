---
status: partial
phase: 04-browse-ux-data-clarity
source: [04-VERIFICATION.md]
started: 2026-05-01T00:00:00Z
updated: 2026-05-01T00:00:00Z
---

## Current Test

Awaiting human browser testing — all automated code checks passed.

## Tests

### 1. Signal Volume chart hidden on Today/Yesterday
expected: Selecting Today or Yesterday on Churn/E&U tabs hides the area chart and shows an inline count stat (e.g. "12 signals today") instead
result: [pending]

### 2. Stat cards unchanged when toggling match filter
expected: Switching All/Matched/Unmatched on Churn/E&U tabs does NOT change the stat card values (Posts Ingested, Signals Generated, match rate) — only the signal list rows below change
result: [pending]

### 3. Modal contents respect match filter
expected: Clicking a chart bar (e.g. community source bar) while Matched is active opens the signal modal filtered to matched signals only
result: [pending]

### 4. Browse signals scroll at 400px
expected: Browse tab signals section scrolls within a fixed ~400px container; the column headers row stays visible above the scroll area as you scroll down
result: [pending]

### 5. Browse posts scroll at 400px
expected: Browse tab posts section scrolls within a fixed ~400px container; the posts header row stays visible above the scroll area
result: [pending]

### 6. Granularity tab resets match filter
expected: In Browse tab, set match filter to Matched, then switch from Week to Month (or any other granularity) — filter pill resets back to All
result: [pending]

### 7. Pipeline delay note renders
expected: Pipeline tab Posts Ingested stat card shows "Updated daily through yesterday" as subtext below the number on all time selections
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
