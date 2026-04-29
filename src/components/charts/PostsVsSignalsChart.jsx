import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function countByDate(rows, dateField) {
  return rows.reduce((acc, row) => {
    const date = row[dateField]
      ? new Date(row[dateField]).toISOString().slice(0, 10)
      : null
    if (!date) return acc
    return { ...acc, [date]: (acc[date] ?? 0) + 1 }
  }, {})
}

export default function PostsVsSignalsChart({ signals, posts }) {
  const signalsByDate = countByDate(signals, 'created_at')
  const postsByDate = countByDate(posts, 'captured_date')

  const allDates = Array.from(
    new Set([...Object.keys(signalsByDate), ...Object.keys(postsByDate)])
  ).sort()

  const data = allDates.map((date) => ({
    date,
    Posts: postsByDate[date] ?? 0,
    Signals: signalsByDate[date] ?? 0,
  }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Posts" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Signals" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
