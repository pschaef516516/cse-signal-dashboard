export default function StatCard({ title, value, subtitle }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E1E6F2',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: '#15181D', margin: 0, lineHeight: 1.2 }}>
        {value === null || value === undefined ? '—' : value}
      </p>
      {subtitle && <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>{subtitle}</p>}
    </div>
  )
}
