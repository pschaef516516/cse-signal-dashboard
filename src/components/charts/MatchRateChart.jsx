import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MatchRateChart({ signals }) {
  const matched = signals.filter((s) => s.match_method != null).length
  const unmatched = signals.length - matched
  const pct = signals.length > 0 ? Math.round((matched / signals.length) * 100) : 0

  const data = [
    { name: 'Matched', value: matched },
    { name: 'Unmatched', value: unmatched },
  ]

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold text-gray-900">{pct}%</p>
      <p className="text-sm text-gray-500">of signals matched to an HCP org</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
            <Cell fill="#10b981" />
            <Cell fill="#e5e7eb" />
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
