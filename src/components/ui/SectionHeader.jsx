export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: '#6B7487', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
  )
}
