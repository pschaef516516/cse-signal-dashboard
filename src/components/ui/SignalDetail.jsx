// Detail view rendered inside SignalDrawer (replaces SignalCardList).
import { normalizeSource } from '../../config/sourceMappings'
import { formatDate, formatConfidence } from '../../utils/format'

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B7487',
  margin: 0,
  minWidth: 120,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  flexShrink: 0,
}

const valueStyle = {
  fontSize: 14,
  color: '#15181D',
  margin: 0,
  wordBreak: 'break-word',
}

const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7487',
  margin: '0 0 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

const linkStyle = {
  color: '#0057FF',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 14,
}

function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value}</p>
    </div>
  )
}

function SectionLabel({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <p style={{ ...sectionLabelStyle, margin: 0, whiteSpace: 'nowrap' }}>{title}</p>
      <div style={{ flex: 1, height: 1, background: '#E1E6F2' }} />
    </div>
  )
}

function MetaSection({ title, children }) {
  return (
    <div style={{ paddingBottom: 16, borderBottom: '1px solid #E1E6F2', marginBottom: 16 }}>
      <SectionLabel title={title} />
      {children}
    </div>
  )
}

export default function SignalDetail({ signal, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Back button — only shown when a back handler is provided (hidden when rendered in SignalModal) */}
      {onBack && (
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
          ← Back to signals
        </button>
      )}

      {/* Signal info */}
      <MetaSection title="Signal">
        <MetaRow label="Org" value={signal.org_name || 'Unknown'} />
        <MetaRow label="Author" value={signal.author_name} />
        <MetaRow label="Source" value={normalizeSource(signal.source)} />
        <MetaRow label="Signal Type" value={signal.signal_type} />
        <MetaRow label="Severity" value={signal.severity} />
        <MetaRow label="Preventability" value={signal.preventability} />
        <MetaRow label="Confidence" value={formatConfidence(signal.confidence)} />
        <MetaRow label="Match Method" value={signal.match_method} />
        <MetaRow label="Category" value={signal.category} />
        <MetaRow label="Created" value={formatDate(signal.created_at)} />
      </MetaSection>

      {/* Customer info */}
      {(signal.plan_name || signal.plan_tier || signal.vertical || signal.segment ||
        signal.status || signal.customer_status || signal.active_subscriptions ||
        signal.org_size || signal.enrollment_date || signal.churn_date ||
        signal.email || signal.phone || signal.author_profile_url) && (
        <MetaSection title="Customer">
          <MetaRow label="Plan" value={signal.plan_name} />
          <MetaRow label="Plan Tier" value={signal.plan_tier} />
          <MetaRow label="Vertical" value={signal.vertical} />
          <MetaRow label="Segment" value={signal.segment} />
          <MetaRow label="Status" value={signal.status} />
          <MetaRow label="Cust. Status" value={signal.customer_status} />
          <MetaRow label="Active Subs" value={signal.active_subscriptions} />
          <MetaRow label="Org Size" value={signal.org_size} />
          <MetaRow label="Enrolled" value={formatDate(signal.enrollment_date)} />
          <MetaRow label="Churn Date" value={formatDate(signal.churn_date)} />
          <MetaRow label="Email" value={signal.email} />
          <MetaRow label="Phone" value={signal.phone} />
          {signal.author_profile_url && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <p style={labelStyle}>Profile</p>
              <a href={signal.author_profile_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                Author Profile →
              </a>
            </div>
          )}
        </MetaSection>
      )}

      {/* Key Quote */}
      {signal.key_quote && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel title="Key Quote" />
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
        </div>
      )}

      {/* Original post text */}
      {signal.text && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionLabel title="Original Post" />
            {signal.post_url && (
              <a href={signal.post_url} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, fontSize: 13, marginBottom: 10 }}>
                View Post →
              </a>
            )}
          </div>
          <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {signal.text}
          </p>
        </div>
      )}

      {/* View Post fallback — shown only when there's no post body to attach the link to */}
      {signal.post_url && !signal.text && (
        <div style={{ marginBottom: 16 }}>
          <a href={signal.post_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            View Post →
          </a>
        </div>
      )}

      {/* Summary */}
      {signal.summary && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel title="Summary" />
          <p style={{ fontSize: 14, color: '#15181D', margin: 0, lineHeight: 1.5 }}>
            {signal.summary}
          </p>
        </div>
      )}

      {/* Suggested Action */}
      {signal.suggested_action && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel title="Suggested Action" />
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
        </div>
      )}

      {/* Routing info */}
      {(signal.routing_reason || signal.routed_at) && (
        <MetaSection title="Routing">
          <MetaRow label="Routed At" value={formatDate(signal.routed_at)} />
          <MetaRow label="Reason" value={signal.routing_reason} />
        </MetaSection>
      )}
    </div>
  )
}
