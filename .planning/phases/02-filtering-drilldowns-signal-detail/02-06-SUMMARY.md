---
plan: 02-06
status: complete
wave: 4
tasks_completed: 1
commits:
  - 99266ed fix(02-gap): unknown fallback, source normalization, posts real columns
  - 44c8556 fix(02-gap): Signal Volume chart shows only bars for active tab type
  - 08a32d0 fix(02-gap): human-readable week labels on charts and drawer titles
---

## Summary

Human verification checkpoint — walked through live dashboard, identified and fixed 5 gaps.

## Verification Outcome

**Status: CONDITIONALLY APPROVED** — core functionality confirmed working; known Phase 03 items captured below.

## Gaps Found and Fixed During Verification

1. **Supabase 400 error on load** — posts table has no `org_name` or `content` columns. Fixed: select `author_name` and `text` instead. Updated BrowseTab display accordingly.

2. **Missing org name shows blank** — `null` org_name rendered as empty. Fixed: show "Unknown" in SignalCard, SignalDetail, BrowseTab signals, and BrowseTab posts author column.

3. **Source name variant** — "Truck Mount Forums: Carpet Cleaning Professionals" and "Truck Mount Forums" are the same community. Fixed: added `src/config/sourceMappings.js` with `normalizeSource()` applied in CommunityChart, EUCommunityChart (pre-aggregation), SignalCard, SignalDetail, and BrowseTab.

4. **Signal Volume chart showing 0-value bars** — Churn tab was rendering Enrollment and Upsell bars (both 0). Fixed: added `mode` prop (`'churn'` | `'eu'`) to SignalVolumeChart; each tab only renders its own signal type bars.

5. **ISO week labels on chart axes** — "2026-W17" is technical noise. Fixed: added `formatWeekLabel()` to aggregate.js converting ISO week keys to "Apr 20" format; applied as `tickFormatter` on both weekly charts and in the drawer title.

## Phase 03 Backlog (captured from verification session)

- **Adaptive chart granularity**: 7d filter → group by day; 30d → by week; 90d → by week/month; All → by week (current)
- **Today / Yesterday time pills**: current filter is rolling N-day windows; needs fixed calendar-day logic
- **Browse tab redesign**: filter by signal type, filter by source, time granularity (day/week/month) — bigger UX rework
- **Clickable post rows in Browse**: open `post_url` in new tab
- **Signal Volume chart aesthetics**: with sparse data (2 bars) the chart looks thin — consider area/line chart
- **Source normalization additions**: add new variants to `sourceMappings.js` as they're discovered
