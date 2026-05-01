---
phase: 05-claude-ai-analysis
plan: "01"
subsystem: backend-serverless
tags: [anthropic, vercel, serverless, api-key-security]
dependency_graph:
  requires: []
  provides: [api/analyze.js, vercel-api-routing]
  affects: [vercel.json, .env.example, package.json]
tech_stack:
  added: ["@anthropic-ai/sdk ^0.92.0"]
  patterns: [vercel-web-handler, process-env-api-key]
key_files:
  created:
    - api/analyze.js
  modified:
    - package.json
    - package-lock.json
    - vercel.json
    - .env.example
decisions:
  - "Used Web Handler syntax (export default async function handler(req)) per current Vercel standard — not legacy module.exports pattern"
  - "ANTHROPIC_API_KEY reads process.env with no VITE_ prefix to prevent embedding key in browser bundle"
  - "Content guard uses optional chaining: message.content?.[0]?.text ?? 'No analysis returned.'"
  - "VITE_ANTHROPIC_API_KEY documented in .env.example as dev-only escape hatch per D-09 locked decision"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-01T19:47:16Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 4
---

# Phase 05 Plan 01: Anthropic SDK + Serverless Function Summary

**One-liner:** Installed @anthropic-ai/sdk 0.92.0, created Vercel Web Handler at api/analyze.js calling Claude Haiku 4.5, and fixed vercel.json to route /api/* before the SPA catch-all.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @anthropic-ai/sdk | 177e789 | package.json, package-lock.json |
| 2 | Create api/analyze.js serverless function | 536c9f8 | api/analyze.js (created) |
| 3 | Fix vercel.json + document env vars | 7ed1a95 | vercel.json, .env.example |

## What Was Built

### api/analyze.js
A new Vercel serverless function that:
- Accepts POST requests with a `{ summary: object }` body
- Calls Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk`
- Returns `{ analysis: string }` on success, `{ error: string }` on failure
- Reads the API key from `process.env.ANTHROPIC_API_KEY` (server-side only, no VITE_ prefix)
- Handles CORS preflight (OPTIONS), method guard (405 for non-POST), and error state (500)
- Guards empty content with `message.content?.[0]?.text ?? 'No analysis returned.'`

### vercel.json
Fixed rewrite order so `/api/:path*` is processed before the SPA catch-all `(.*)`. Without this fix, all `/api/analyze` requests would have been served `index.html` (HTML instead of JSON).

### .env.example
Documented two env var names:
- `ANTHROPIC_API_KEY` — server-side only, for production (Vercel project settings) and local dev with `vercel dev`
- `VITE_ANTHROPIC_API_KEY` — dev-only escape hatch, allows frontend to call Anthropic directly without `vercel dev` running; must NOT be set in Vercel production env vars

## Decisions Made

1. **Web Handler syntax chosen over legacy Node format** — Vercel's current standard for non-Next.js frameworks; uses `Request`/`Response` Web APIs instead of `res.send()`
2. **No VITE_ prefix in api/analyze.js** — prevents API key from being embedded in the Vite browser bundle at build time
3. **Optional chaining content guard** — defensive against rare cases where Claude returns empty content array (max_tokens hit with no output, filtered response)
4. **VITE_ANTHROPIC_API_KEY documented** — matches the D-09 locked decision from CONTEXT.md which references the dev-only escape hatch pattern

## Verification Results

- `npm run build` passes (chunk size warning is pre-existing from recharts, not introduced by this plan)
- `node -e "require('@anthropic-ai/sdk')"` — no throw
- `api/analyze.js` exports a default async function — confirmed
- `vercel.json` first rewrite is `/api/:path*` — confirmed
- `grep -c "VITE_ANTHROPIC" api/analyze.js` returns 0 — confirmed API key is not VITE_-prefixed in serverless function

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan creates infrastructure only (serverless function, routing config, env var docs). No UI components, no data rendering. The `api/analyze.js` function is fully wired to Anthropic — it will work as soon as `ANTHROPIC_API_KEY` is set in Vercel project settings.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: api-key-exposure-risk | .env.example | VITE_ANTHROPIC_API_KEY documented as dev-only escape hatch — comment explicitly warns it must not be set in Vercel production env vars. Risk is documentation-level only; the serverless function itself never reads VITE_-prefixed vars. |

## Self-Check: PASSED

- [x] api/analyze.js exists at `/api/analyze.js`
- [x] Commit 177e789 exists (SDK install)
- [x] Commit 536c9f8 exists (serverless function)
- [x] Commit 7ed1a95 exists (vercel.json + .env.example)
- [x] All acceptance criteria verified via automated checks
