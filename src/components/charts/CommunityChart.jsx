import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { countByField } from '../../utils/aggregate'
import { normalizeSource } from '../../config/sourceMappings'

const COLORS = ['#0057FF', '#3378FF', '#6699FF', '#99BBFF', '#B2CDFF', '#CCdDFF', '#E3ECFF']

export default function CommunityChart({ signals, onBarClick }) {
  const normalized = signals.map((s) => ({ ...s, source: normalizeSource(s.source) }))
  const data = countByField(normalized, 'source')

  if (data.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar
          dataKey="count"
          name="Signals"
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
