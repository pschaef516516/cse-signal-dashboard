import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SEVERITY_COLORS = { low: '#BF8600', medium: '#D81860', high: '#880E4F' }
const ORDER = ['low', 'medium', 'high']

export default function SeverityChart({ signals, onBarClick }) {
  const counts = signals.reduce((acc, s) => {
    const key = s.severity ?? 'unknown'
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})

  const data = ORDER.map((level) => ({
    level,
    count: counts[level] ?? 0,
  }))

  if (signals.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} style={onBarClick ? { cursor: 'pointer' } : undefined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="level" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar
          dataKey="count"
          name="Signals"
          onClick={onBarClick ? (entry) => onBarClick(entry.level) : undefined}
        >
          {data.map((entry) => (
            <Cell key={entry.level} fill={SEVERITY_COLORS[entry.level] ?? '#9ca3af'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
