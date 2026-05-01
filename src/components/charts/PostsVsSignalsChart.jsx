import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function countByWeek(rows, dateField) {
  return rows.reduce((acc, row) => {
    const raw = row[dateField]
    if (!raw) return acc
    const d = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(raw + 'T00:00:00')
      : new Date(raw)
    if (isNaN(d)) return acc
    const tmp = new Date(d)
    tmp.setHours(0, 0, 0, 0)
    tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7))
    const year = tmp.getFullYear()
    const week = Math.ceil(((tmp - new Date(year, 0, 1)) / 86400000 + 1) / 7)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}

function formatWeek(isoWeek) {
  if (!isoWeek) return ''
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const mon = new Date(jan4)
  mon.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7)
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PostsVsSignalsChart({ signals, posts }) {
  const signalsByWeek = countByWeek(signals, 'created_at')
  const postsByWeek = countByWeek(posts, 'captured_date')

  const allWeeks = Array.from(
    new Set([...Object.keys(signalsByWeek), ...Object.keys(postsByWeek)])
  ).sort()

  const data = allWeeks.map((week) => ({
    week: formatWeek(week),
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
        {/* Left axis for Posts volume */}
        <YAxis
          yAxisId="posts"
          orientation="left"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6B7487' }}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        {/* Right axis for Signals — separate scale so signals are visible */}
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
