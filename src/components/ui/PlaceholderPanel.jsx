export default function PlaceholderPanel({ title, description }) {
  return (
    <div style={{
      background: '#F2F6FD',
      border: '1px dashed #E1E6F2',
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 180,
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: 0, textAlign: 'center' }}>{title}</p>
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0, textAlign: 'center', maxWidth: 280 }}>{description}</p>
    </div>
  )
}
