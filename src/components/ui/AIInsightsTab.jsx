// src/components/ui/AIInsightsTab.jsx
// Phase 05 — AI Insights tab. Self-contained: owns its own loading/error/analysis state.
// Auto-runs analysis on mount (D-03). Sends a pre-aggregated summary (D-05) — never raw rows.
// Dual-path fetch:
//   dev  (import.meta.env.DEV)  -> calls Anthropic API directly with VITE_ANTHROPIC_API_KEY
//   prod (Vercel)               -> POSTs /api/analyze (serverless function holds the key)

import { useEffect, useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { countByField } from '../../utils/aggregate'

// Panel — copied verbatim from PipelineTab.jsx lines 5-14. Defined locally per project pattern.
function Panel({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 20 }}>
      {title && (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', marginBottom: 16 }}>{title}</p>
      )}
      {children}
    </div>
  )
}

export default function AIInsightsTab({ signals }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Auto-run on mount (D-03). Empty deps = run once. See RESEARCH.md Pitfall 4.
    runAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runAnalysis() {
    // Skip if we already have an analysis (component re-mounted with cached state) or already loading
    if (analysis || loading) return

    setLoading(true)
    setError(null)

    try {
      const summary = buildSummary(signals)
      let analysisText

      if (import.meta.env.DEV) {
        // DEV PATH — call Anthropic directly from the browser using VITE_ANTHROPIC_API_KEY.
        // dangerouslyAllowBrowser is required by the SDK to opt-in to browser usage.
        // This bypasses the serverless function so `npm run dev` works without `vercel dev`.
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
        if (!apiKey) {
          throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
        }
        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Analyze this signal pipeline summary as of ${summary.date}:\n\n${JSON.stringify(summary, null, 2)}`,
            },
          ],
        })
        analysisText = message.content?.[0]?.text ?? 'No analysis returned.'
      } else {
        // PROD PATH — POST to /api/analyze. Serverless function holds the key.
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // required — RESEARCH.md Pitfall 5
          body: JSON.stringify({ summary }),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        analysisText = data.analysis
      }

      setAnalysis(analysisText)
    } catch (err) {
      console.error('AI analysis failed:', err)
      setError('Could not load analysis. Please refresh the page to try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Panel title="AI Signal Analysis">
        {loading && (
          <p style={{ color: '#6B7487', fontSize: 14, margin: 0 }}>Analyzing signals…</p>
        )}
        {error && (
          <p style={{ color: '#D81860', fontSize: 14, margin: 0 }}>{error}</p>
        )}
        {analysis && (
          <p style={{ fontSize: 14, color: '#15181D', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
            {analysis}
          </p>
        )}
        {!loading && !error && !analysis && (
          <p style={{ color: '#6B7487', fontSize: 14, margin: 0 }}>No analysis yet.</p>
        )}
      </Panel>
    </div>
  )
}

// System prompt — focused on actionable CSE insights (Claude's discretion, per CONTEXT.md).
const SYSTEM_PROMPT = `You are a CSE (Customer Success Engineering) analyst at HousecallPro.
Analyze the signal pipeline data and provide a concise written summary for the CSE team.
Focus on: overall pipeline health, match rate quality, high-severity signals, and the top sources and categories.
Write in plain English with short paragraphs or bullet points. Be direct and actionable.`

// buildSummary — aggregates raw signals into the D-05 summary object.
// Module-level helper, immutable, no mutation. Filter expressions copied from App.jsx lines 139-141, 164-171.
function buildSummary(signals) {
  const matched = signals.filter((s) => s.match_method != null && s.match_method !== 'not_found')
  const highSeverity = signals.filter((s) => s.severity === 'high')
  const churn = signals.filter((s) => s.signal_type === 'churn')
  const enrollment = signals.filter((s) => s.signal_type === 'enrollment')
  const topSources = countByField(signals, 'source').slice(0, 3)
  const topCategories = countByField(signals, 'category').slice(0, 3)

  return {
    date: new Date().toISOString().split('T')[0],
    totalSignals: signals.length,
    matchedCount: matched.length,
    matchRatePct: signals.length > 0 ? Math.round((matched.length / signals.length) * 100) : 0,
    highSeverityCount: highSeverity.length,
    churnSignalCount: churn.length,
    enrollmentSignalCount: enrollment.length,
    top3Sources: topSources,
    top3Categories: topCategories,
  }
}
