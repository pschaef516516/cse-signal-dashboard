import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupBySourceAndType } from '../../utils/aggregate'

// Per D-12: source breakdown for E&U signals — split by enrollment vs upsell per source.
// Per D-05 (cross-AI review fix): the community-style chart on the E&U tab is also a
// drill-down target. Both bars (enrollment + upsell) for a given source share the same
// `entry.name` (source) — the drill-down filters by source on the E&U tab.
// Data shape from groupBySourceAndType: [{ name, enrollment, upsell }, ...] sorted by total desc.
export default function EUCommunityChart({ signals, onBarClick }) {
  const data = groupBySourceAndType(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
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
        <Legend />
        <Bar
          dataKey="enrollment"
          fill="#0057FF"
          name="Enrollment"
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
        />
        <Bar
          dataKey="upsell"
          fill="#623CC9"
          name="Upsell"
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
