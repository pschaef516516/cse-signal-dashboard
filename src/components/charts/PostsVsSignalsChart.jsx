import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getISOWeekLabel, formatWeekLabel } from '../../utils/aggregate'

function countByWeek(rows, dateField) {
  return rows.reduce((acc, row) => {
    const raw = row[dateField]
    if (!raw) return acc
    const d = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(raw + 'T00:00:00')
      : new Date(raw)
    if (isNaN(d)) return acc
    const key = getISOWeekLabel(d)
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}

export default function PostsVsSignalsChart({ signals, posts }) {
  const signalsByWeek = countByWeek(signals, 'created_at')
  const postsByWeek = countByWeek(posts, 'captured_date')

  const allWeeks = Array.from(
    new Set([...Object.keys(signalsByWeek), ...Object.keys(postsByWeek)])
  ).sort()

  const data = allWeeks.map((week) => ({
    week: formatWeekLabel(week),
    Posts: postsByWeek[week] ?? 0,
    Signals: signalsByWeek[week] ?? 0,
  }))

  if (data.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 4, right: 48, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7487' }} interval="preserveStartEnd" />
        <YAxis
          yAxisId="posts"
          orientation="left"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6B7487' }}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <YAxis
          yAxisId="signals"
          orientation="right"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#00A344' }}
        />
        <Tooltip />
        <Legend />
        <Bar yAxisId="posts" dataKey="Posts" fill="#0057FF" opacity={0.25} barSize={24} />
        <Line
          yAxisId="signals"
          type="monotone"
          dataKey="Signals"
          stroke="#00A344"
          strokeWidth={2}
          dot={{ r: 3, fill: '#00A344' }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
