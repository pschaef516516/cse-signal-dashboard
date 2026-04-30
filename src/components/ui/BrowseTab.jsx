import { useEffect, useState } from 'react'
import { fetchSignalsByDate, fetchPostsByDate } from '../../api/supabase'
import { normalizeSource } from '../../config/sourceMappings'

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
// against the T-02-13 injection threat — PostgREST also rejects invalid dates,
// but this guard avoids unnecessary network round-trips).
function isValidDateString(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function formatConfidence(c) {
  if (c === null || c === undefined) return '—'
  const num = Number(c)
  return isNaN(num) ? '—' : num.toFixed(2)
}

// First 120 characters of the post content, with an ellipsis if truncated (D-19).
function previewText(content) {
  if (!content) return '—'
  const s = String(content)
  return s.length > 120 ? `${s.slice(0, 120)}…` : s
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
  gridTemplateColumns: '1fr 1.2fr 3fr',
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
  gridTemplateColumns: '1fr 1.2fr 3fr',
  gap: 12,
  padding: '12px',
  borderBottom: '1px solid #E1E6F2',
  fontSize: 14,
  color: '#15181D',
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
  const [selectedDate, setSelectedDate] = useState(yesterdayString())
  const [signalsForDate, setSignalsForDate] = useState([])
  const [postsForDate, setPostsForDate] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Refetch whenever the date changes (D-16: date picker drives both lists).
  useEffect(() => {
    if (!isValidDateString(selectedDate)) {
      setSignalsForDate([])
      setPostsForDate([])
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, p] = await Promise.all([
          fetchSignalsByDate(selectedDate),
          fetchPostsByDate(selectedDate),
        ])
        if (cancelled) return
        setSignalsForDate(s)
        setPostsForDate(p)
      } catch (err) {
        if (cancelled) return
        setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedDate])

  return (
    <div>
      {/* Date picker (D-16) */}
      <div style={{ ...sectionPanelStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label
          htmlFor="browse-date-picker"
          style={{ fontSize: 14, fontWeight: 600, color: '#15181D' }}
        >
          Date:
        </label>
        <input
          id="browse-date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #E1E6F2',
            borderRadius: 8,
            color: '#15181D',
            background: '#FFFFFF',
          }}
        />
        {loading && (
          <span style={{ fontSize: 12, color: '#6B7487' }}>Loading…</span>
        )}
        {error && (
          <span style={{ fontSize: 12, color: '#D81860' }}>Error: {error}</span>
        )}
      </div>

      {/* Signals section (D-17, D-18, D-20) */}
      <div style={sectionPanelStyle}>
        <p style={sectionTitleStyle}>Signals ({signalsForDate.length})</p>

        {signalsForDate.length === 0 ? (
          <p style={emptyStateStyle}>No signals found for this date</p>
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
            {signalsForDate.map((s) => (
              <div
                key={s.id}
                onClick={() => onSignalClick(s)}
                style={tableRowStyle(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSignalClick(s)
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
        )}
      </div>

      {/* Posts section (D-17, D-19, D-20) — display-only, no onClick */}
      <div style={sectionPanelStyle}>
        <p style={sectionTitleStyle}>Posts ({postsForDate.length})</p>

        {postsForDate.length === 0 ? (
          <p style={emptyStateStyle}>No posts found for this date</p>
        ) : (
          <div>
            <div style={postsHeaderRowStyle}>
              <span>Captured</span>
              <span>Author</span>
              <span>Content Preview</span>
            </div>
            {postsForDate.map((p) => (
              <div key={p.id} style={postsRowStyle}>
                <span>{formatDate(p.captured_date)}</span>
                <span>{p.author_name || 'Unknown'}</span>
                <span>{previewText(p.text)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
