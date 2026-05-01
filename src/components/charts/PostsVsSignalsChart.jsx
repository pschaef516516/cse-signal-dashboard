import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// Groups rows by ISO week using the specified date field.
// Returns a map of { 'YYYY-WXX': count }.
function countByWeek(rows, dateField) {
  return rows.reduce((acc, row) => {
    const raw = row[dateField]
    if (!raw) return acc
    // Date-only strings must be parsed as local midnight to avoid UTC timezone shift.
    const d = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(raw + 'T00:00:00')
      : new Date(raw)
    if (isNaN(d)) return acc
    // ISO week calculation
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
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7487' }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7487' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Posts" stroke="#0057FF" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Signals" stroke="#00A344" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
