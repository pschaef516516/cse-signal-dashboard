import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MatchRateChart({ signals }) {
  const matched = signals.filter((s) => s.match_method != null && s.match_method !== 'not_found').length
  const unmatched = signals.length - matched
  const pct = signals.length > 0 ? Math.round((matched / signals.length) * 100) : 0

  const data = [
    { name: 'Matched', value: matched },
    { name: 'Unmatched', value: unmatched },
  ]

  if (signals.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 40, fontWeight: 700, color: '#15181D', margin: 0 }}>{pct}%</p>
      <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>of signals matched to an HCP org</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
            <Cell fill="#00A344" />
            <Cell fill="#E1E6F2" />
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
