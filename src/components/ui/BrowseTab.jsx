import { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts, fetchSignalsByDate, fetchPostsByDate, fetchSignalsByRange, fetchPostsByRange } from '../../api/supabase'
import { getRecentWeeks, getWeekRange, getRecentMonths, getMonthRange, formatWeekRangeLabel, formatMonthLabel } from '../../utils/dateRanges'
import { normalizeSource } from '../../config/sourceMappings'
import { formatDate, formatConfidence } from '../../utils/format'
import BrowseFilterPill from './BrowseFilterPill'

// --- Helpers ----------------------------------------------------------------

// Yesterday in local time, formatted YYYY-MM-DD for an <input type="date" />.
function yesterdayString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Validate the date string before passing to fetch helpers (defense-in-depth
// against injection — PostgREST also rejects invalid dates, but this guard
// avoids unnecessary network round-trips).
function isValidDateString(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// First 120 characters of the post content, with an ellipsis if truncated.
function previewText(content) {
  if (!content) return '—'
  const s = String(content)
  return s.length > 120 ? `${s.slice(0, 120)}…` : s
}

// Phase 04 — pill button style for match filter (copied verbatim from FilterPills.jsx lines 8-19).
function pillStyle(active) {
  return {
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
    background: active ? '#0057FF' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#6B7487',
    cursor: 'pointer',
    minHeight: 36,
  }
}

// --- Shared inline styles ---------------------------------------------------

const sectionPanelStyle = {
  background: '#FFFFFF',
  border: '1px solid #E1E6F2',
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
}

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: '#6B7487',
  marginTop: 0,
  marginBottom: 16,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const tableHeaderRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 0.8fr 1fr 0.8fr 1fr',
  gap: 12,
  padding: '8px 12px',
  borderBottom: '1px solid #E1E6F2',
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7487',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const tableRowStyle = (clickable) => ({
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr 0.8fr 1fr 0.8fr 1fr',
  gap: 12,
  padding: '12px',
  borderBottom: '1px solid #E1E6F2',
  fontSize: 14,
  color: '#15181D',
  cursor: clickable ? 'pointer' : 'default',
  transition: clickable ? 'background 0.15s' : undefined,
})

const postsHeaderRowStyle = {
  display: 'grid',
  gridTemplateColumns: '0.7fr 0.6fr 1fr 1fr 2fr 0.5fr',
  gap: 12,
  padding: '8px 12px',
  borderBottom: '1px solid #E1E6F2',
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7487',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const postsRowStyle = {
  display: 'grid',
  gridTemplateColumns: '0.7fr 0.6fr 1fr 1fr 2fr 0.5fr',
  gap: 12,
  padding: '12px',
  borderBottom: '1px solid #E1E6F2',
  fontSize: 14,
  color: '#15181D',
  alignItems: 'center',
}

const emptyStateStyle = {
  textAlign: 'center',
  padding: '32px 0',
  fontSize: 14,
  color: '#6B7487',
  margin: 0,
}

// --- Component --------------------------------------------------------------

export default function BrowseTab({ onSignalClick }) {
  // Granularity selection — which time period mode is active.
  const [granularity, setGranularity] = useState('day') // 'day' | 'week' | 'month' | 'all'

  // Day granularity — existing date picker, defaults to yesterday.
  const [selectedDate, setSelectedDate] = useState(yesterdayString())

  // Week granularity — ISO week string ('YYYY-WXX') or null (uses weekOptions[0]).
  const [selectedWeek, setSelectedWeek] = useState(null)

  // Month granularity — 'YYYY-MM' string or null (uses monthOptions[0]).
  const [selectedMonth, setSelectedMonth] = useState(null)

  // Raw data from the server for the active period.
  const [signalsForDate, setSignalsForDate] = useState([])
  const [postsForDate, setPostsForDate] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter state — signals only (D-07). Posts section has no filters.
  const [sourceFilter, setSourceFilter] = useState(null)
  const [severityFilter, setSeverityFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)
  const [confidenceFilter, setConfidenceFilter] = useState(null)
  // Phase 04 — match filter (D-03 to D-05). Same shape as other Browse filters.
  const [matchFilter, setMatchFilter] = useState('all') // 'all' | 'matched' | 'unmatched'

  // Reset all filter pills whenever the granularity tab changes.
  useEffect(() => {
    setSourceFilter(null)
    setSeverityFilter(null)
    setTypeFilter(null)
    setConfidenceFilter(null)
    setMatchFilter('all')  // Phase 04 ADDITION (D-03, Pitfall 3)
  }, [granularity])

  // Precompute option lists for the week/month selects.
  const weekOptions = getRecentWeeks(12)   // ['2026-W17', '2026-W16', ...]
  const monthOptions = getRecentMonths(12) // ['2026-04', '2026-03', ...]

  // Fetch data whenever granularity or the relevant picker value changes.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        let signals = []
        let posts = []

        if (granularity === 'day') {
          if (!isValidDateString(selectedDate)) {
            setSignalsForDate([])
            setPostsForDate([])
            setLoading(false)
            return
          }
          ;[signals, posts] = await Promise.all([
            fetchSignalsByDate(selectedDate),
            fetchPostsByDate(selectedDate),
          ])
        } else if (granularity === 'week') {
          const week = selectedWeek || weekOptions[0]
          if (week) {
            const { start, end } = getWeekRange(week)
            const startISO = `${start.toISOString().slice(0, 10)}T00:00:00`
            const endISO = `${end.toISOString().slice(0, 10)}T23:59:59`
            const startDate = start.toISOString().slice(0, 10)
            const endDate = end.toISOString().slice(0, 10)
            ;[signals, posts] = await Promise.all([
              fetchSignalsByRange(startISO, endISO),
              fetchPostsByRange(startDate, endDate),
            ])
          }
        } else if (granularity === 'month') {
          const month = selectedMonth || monthOptions[0]
          if (month) {
            const { start, end } = getMonthRange(month)
            const startISO = `${start.toISOString().slice(0, 10)}T00:00:00`
            const endISO = `${end.toISOString().slice(0, 10)}T23:59:59`
            const startDate = start.toISOString().slice(0, 10)
            const endDate = end.toISOString().slice(0, 10)
            ;[signals, posts] = await Promise.all([
              fetchSignalsByRange(startISO, endISO),
              fetchPostsByRange(startDate, endDate),
            ])
          }
        } else if (granularity === 'all') {
          // All Time — fetch everything without a date constraint (D-09).
          ;[signals, posts] = await Promise.all([fetchSignals(), fetchPosts()])
        }

        if (cancelled) return
        setSignalsForDate(signals)
        setPostsForDate(posts)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [granularity, selectedDate, selectedWeek, selectedMonth])

  // --- Filter option lists (derived from raw signal data) -------------------

  const sourceOptions = [...new Set(
    signalsForDate.map((s) => normalizeSource(s.source)).filter(Boolean)
  )].sort()
  const severityOptions = ['low', 'medium', 'high']
  const typeOptions = ['churn', 'enrollment']
  const confidenceOptions = ['0.0–0.3', '0.3–0.6', '0.6–0.8', '0.8–1.0']

  // --- Apply active filters to produce the visible signal list (D-07, D-08) --

  const displayedSignals = signalsForDate.filter((s) => {
    if (sourceFilter && normalizeSource(s.source) !== sourceFilter) return false
    if (severityFilter && s.severity !== severityFilter) return false
    if (typeFilter && s.signal_type !== typeFilter) return false
    if (confidenceFilter) {
      const conf = parseFloat(s.confidence)
      const [loStr, hiStr] = confidenceFilter.split('–')
      const lo = parseFloat(loStr)
      const hi = parseFloat(hiStr)
      if (isNaN(conf) || conf < lo || conf > hi) return false
    }
    // Phase 04 ADDITION — match filter (D-04). AND-chained with other filters.
    if (matchFilter === 'matched' && !(s.match_method != null && s.match_method !== 'not_found')) return false
    if (matchFilter === 'unmatched' && s.match_method !== 'not_found') return false
    return true
  })

  return (
    <div>
      {/* Granularity tab bar + picker (D-06) */}
      <div style={{ ...sectionPanelStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Granularity tab row */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E1E6F2', paddingBottom: 12 }}>
          {['day', 'week', 'month', 'all'].map((g) => {
            const labels = { day: 'Day', week: 'Week', month: 'Month', all: 'All Time' }
            const active = granularity === g
            return (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? '#0057FF' : '#6B7487',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #0057FF' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {labels[g]}
              </button>
            )
          })}
        </div>

        {/* Picker row — only shown for day / week / month */}
        {granularity === 'day' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label htmlFor="browse-date-picker" style={{ fontSize: 14, fontWeight: 600, color: '#15181D' }}>Date:</label>
            <input
              id="browse-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #E1E6F2', borderRadius: 8, color: '#15181D', background: '#FFFFFF' }}
            />
          </div>
        )}

        {granularity === 'week' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#15181D' }}>Week:</label>
            <select
              value={selectedWeek || weekOptions[0] || ''}
              onChange={(e) => setSelectedWeek(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #E1E6F2', borderRadius: 8, color: '#15181D', background: '#FFFFFF' }}
            >
              {weekOptions.map((w) => (
                <option key={w} value={w}>{formatWeekRangeLabel(w)}</option>
              ))}
            </select>
          </div>
        )}

        {granularity === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#15181D' }}>Month:</label>
            <select
              value={selectedMonth || monthOptions[0] || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #E1E6F2', borderRadius: 8, color: '#15181D', background: '#FFFFFF' }}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        )}

        {loading && <span style={{ fontSize: 12, color: '#6B7487' }}>Loading…</span>}
        {error && <span style={{ fontSize: 12, color: '#D81860' }}>Error: {error}</span>}
      </div>

      {/* Signals section with filter pills (D-07, D-08) */}
      <div style={sectionPanelStyle}>
        {/* Title shows filtered count vs total count when filters are active */}
        <p style={sectionTitleStyle}>
          Signals ({displayedSignals.length}{displayedSignals.length !== signalsForDate.length ? ` of ${signalsForDate.length}` : ''})
        </p>

        {/* Filter pills row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <BrowseFilterPill label="Source" options={sourceOptions} value={sourceFilter} onChange={setSourceFilter} />
          <BrowseFilterPill label="Severity" options={severityOptions} value={severityFilter} onChange={setSeverityFilter} />
          <BrowseFilterPill label="Type" options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
          <BrowseFilterPill label="Confidence" options={confidenceOptions} value={confidenceFilter} onChange={setConfidenceFilter} />
        </div>

        {/* Phase 04 — Match filter pill row (D-03, D-04, D-05) */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7487' }}>Match status:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'all', label: 'All' },
              { value: 'matched', label: 'Matched' },
              { value: 'unmatched', label: 'Unmatched' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMatchFilter(opt.value)}
                style={pillStyle(matchFilter === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {displayedSignals.length === 0 ? (
          <p style={emptyStateStyle}>No signals found for this period</p>
        ) : (
          <div>
            <div style={tableHeaderRowStyle}>
              <span>Org</span>
              <span>Signal Type</span>
              <span>Severity</span>
              <span>Source</span>
              <span>Confidence</span>
              <span>Created</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {displayedSignals.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSignalClick(s, displayedSignals)}
                  style={tableRowStyle(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSignalClick(s, displayedSignals)
                  }}
                >
                  <span>{s.org_name || 'Unknown'}</span>
                  <span>{s.signal_type ?? '—'}</span>
                  <span>{s.severity ?? '—'}</span>
                  <span>{normalizeSource(s.source)}</span>
                  <span>{formatConfidence(s.confidence)}</span>
                  <span>{formatDate(s.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Posts section — no filter pills (D-07) */}
      <div style={sectionPanelStyle}>
        <p style={sectionTitleStyle}>Posts ({postsForDate.length})</p>

        {postsForDate.length === 0 ? (
          <p style={emptyStateStyle}>No posts found for this period</p>
        ) : (
          <div>
            <div style={postsHeaderRowStyle}>
              <span>Captured</span>
              <span>Type</span>
              <span>Source</span>
              <span>Author</span>
              <span>Content Preview</span>
              <span>Post</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {postsForDate.map((p) => (
                <div key={p.id} style={postsRowStyle}>
                  <span>{formatDate(p.captured_date)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{p.record_type || '—'}</span>
                  <span>{normalizeSource(p.source)}</span>
                  <span>
                    {p.author_profile_url ? (
                      <a
                        href={p.author_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0057FF', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {p.author_name || 'Unknown'}
                      </a>
                    ) : (
                      p.author_name || 'Unknown'
                    )}
                  </span>
                  <span>{previewText(p.text)}</span>
                  <span>
                    {p.post_url ? (
                      <a
                        href={p.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0057FF', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
                      >
                        View →
                      </a>
                    ) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
