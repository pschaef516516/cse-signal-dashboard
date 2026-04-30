import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek, formatWeekLabel } from '../../utils/aggregate'

export default function SignalVolumeChart({ signals, onBarClick, mode = 'all' }) {
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  const click = onBarClick ? (entry) => onBarClick(entry.week) : undefined

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} style={onBarClick ? { cursor: 'pointer' } : undefined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={formatWeekLabel} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {(mode === 'churn') && (
          <Bar dataKey="churn" stackId="a" fill="#D81860" name="Churn" onClick={click} />
        )}
        {(mode === 'eu') && (
          <Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" onClick={click} />
        )}
        {(mode === 'eu') && (
          <Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" onClick={click} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
