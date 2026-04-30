// Single signal card + list wrapper used inside SignalDrawer.
// Per D-06: shows org name, source, severity, confidence, match method, created date.
// Phase 03-05: StatusBadge added — green "Active" or red "Churned" pill next to org name.
import { normalizeSource } from '../../config/sourceMappings'
import { formatDate, formatConfidence } from '../../utils/format'

// customer_status is the account health field; signal.status is pipeline routing state ("processed" etc).
// Churned = churn_date present OR customer_status contains "churn".
// Active = customer_status is "active" OR active_subscriptions > 0 (no churn_date).
function StatusBadge({ signal }) {
  const customerStatus = (signal.customer_status || '').toLowerCase()
  const isChurned =
    Boolean(signal.churn_date) ||
    customerStatus.includes('churn')
  const isActive =
    !isChurned && (
      customerStatus === 'active' ||
      (signal.active_subscriptions != null && Number(signal.active_subscriptions) > 0)
    )

  if (!isChurned && !isActive) return null

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      background: isChurned ? '#FDE8EF' : '#E6F7EE',
      color: isChurned ? '#D81860' : '#00A344',
      marginLeft: 6,
      verticalAlign: 'middle',
      flexShrink: 0,
    }}>
      {isChurned ? 'Churned' : 'Active'}
    </span>
  )
}

export default function SignalCard({ signal, onClick }) {
  return (
    <div
      onClick={() => onClick(signal)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E1E6F2',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
        <span>{signal.org_name || 'Unknown'}</span>
        <StatusBadge signal={signal} />
      </p>
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>
        {normalizeSource(signal.source)} · Severity: {signal.severity ?? '—'} · Confidence: {formatConfidence(signal.confidence)}
      </p>
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>
        Match: {signal.match_method ?? '—'} · {formatDate(signal.created_at)}
      </p>
    </div>
  )
}

export function SignalCardList({ signals, onSelect }) {
  if (!signals || signals.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: 0 }}>No signals found</p>
        <p style={{ fontSize: 12, color: '#6B7487', margin: '8px auto 0', maxWidth: 280 }}>
          No signals match this filter for the selected time period. Try adjusting the time period filter.
        </p>
      </div>
    )
  }
  return (
    <div>
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} onClick={onSelect} />
      ))}
    </div>
  )
}
