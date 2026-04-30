// Detail view rendered inside SignalDrawer (replaces SignalCardList).
import { normalizeSource } from '../../config/sourceMappings'
// Per D-09: detail view replaces the list within the same drawer.
// Per D-10: metadata at top, key_quote as quote block, summary as paragraph, suggested_action as styled callout.
// Per D-11: back button only — no prev/next arrows.

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

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7487',
  margin: 0,
  minWidth: 100,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const valueStyle = {
  fontSize: 14,
  color: '#15181D',
  margin: 0,
}

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7487',
  margin: '0 0 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export default function SignalDetail({ signal, onBack }) {
  const rows = [
    ['Org', signal.org_name || 'Unknown'],
    ['Source', normalizeSource(signal.source)],
    ['Signal Type', signal.signal_type],
    ['Severity', signal.severity],
    ['Confidence', formatConfidence(signal.confidence)],
    ['Match Method', signal.match_method],
    ['Created', formatDate(signal.created_at)],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Back button (D-11) */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#0057FF',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '0 0 16px',
          textAlign: 'left',
          alignSelf: 'flex-start',
        }}
      >
        Back to signals
      </button>

      {/* Metadata block (D-10) */}
      <div style={{ paddingBottom: 16, borderBottom: '1px solid #E1E6F2', marginBottom: 16 }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <p style={labelStyle}>{label}</p>
            <p style={valueStyle}>{val ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Key Quote section (D-10) */}
      <div style={{ marginBottom: 16 }}>
        <p style={sectionLabelStyle}>Key Quote</p>
        {signal.key_quote ? (
          <blockquote style={{
            background: '#F5F7FF',
            borderLeft: '4px solid #0057FF',
            padding: '12px 16px',
            margin: 0,
            fontSize: 14,
            fontStyle: 'italic',
            color: '#15181D',
            lineHeight: 1.6,
          }}>
            {signal.key_quote}
          </blockquote>
        ) : (
          <p style={{ fontSize: 14, color: '#6B7487', margin: 0 }}>—</p>
        )}
      </div>

      {/* Summary section (D-10) */}
      <div style={{ marginBottom: 16 }}>
        <p style={sectionLabelStyle}>Summary</p>
        <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5 }}>
          {signal.summary ?? '—'}
        </p>
      </div>

      {/* Suggested Action callout (D-10) */}
      <div>
        <p style={sectionLabelStyle}>Suggested Action</p>
        {signal.suggested_action ? (
          <div style={{
            background: '#F0FFF6',
            border: '1px solid #B3EAC8',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5 }}>
              {signal.suggested_action}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#6B7487', margin: 0 }}>—</p>
        )}
      </div>
    </div>
  )
}
