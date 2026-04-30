// Time period filter pills — used in App.jsx header row, same row as tabs.
// Per D-01, D-02, D-03: pills are presentational; per-tab state lives in App.jsx.
const OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
]

export default function FilterPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>
      {OPTIONS.map(({ label, days }) => {
        const active = value === days
        return (
          <button
            key={label}
            onClick={() => onChange(days)}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
              border: active ? '1px solid #0057FF' : '1px solid #E1E6F2',
              background: active ? '#0057FF' : '#FFFFFF',
              color: active ? '#FFFFFF' : '#6B7487',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              minHeight: 36,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
