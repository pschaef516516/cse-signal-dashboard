import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function MatchByTypeChart({ signals }) {
  const types = ['churn', 'enrollment', 'upsell']

  const data = types.map((type) => {
    const subset = signals.filter((s) => s.signal_type === type)
    return {
      type,
      Matched: subset.filter((s) => s.match_method != null).length,
      Unmatched: subset.filter((s) => s.match_method == null).length,
    }
  })

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Matched" fill="#10b981" />
        <Bar dataKey="Unmatched" fill="#e5e7eb" />
      </BarChart>
    </ResponsiveContainer>
  )
}
