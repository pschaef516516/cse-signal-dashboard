import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek, formatWeekLabel } from '../../utils/aggregate'

export default function SignalVolumeChart({ signals, onBarClick, mode = 'all' }) {
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
  }

  const click = onBarClick ? (entry) => onBarClick(entry.week) : undefined
  const clickStyle = onBarClick ? { cursor: 'pointer' } : undefined

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }} style={clickStyle}>
        <defs>
          <linearGradient id="fillChurn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D81860" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#D81860" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillEnrollment" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0057FF" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0057FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillUpsell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#623CC9" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#623CC9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={formatWeekLabel} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={formatWeekLabel} />
        <Legend />
        {mode === 'churn' && (
          <Area
            type="monotone"
            dataKey="churn"
            name="Churn"
            stroke="#D81860"
            strokeWidth={2}
            fill="url(#fillChurn)"
            dot={{ r: 4, fill: '#D81860' }}
            activeDot={click ? { r: 6, onClick: (_, payload) => click(payload) } : { r: 6 }}
          />
        )}
        {mode === 'eu' && (
          <Area
            type="monotone"
            dataKey="enrollment"
            name="Enrollment"
            stroke="#0057FF"
            strokeWidth={2}
            fill="url(#fillEnrollment)"
            dot={{ r: 4, fill: '#0057FF' }}
            activeDot={click ? { r: 6, onClick: (_, payload) => click(payload) } : { r: 6 }}
          />
        )}
        {mode === 'eu' && (
          <Area
            type="monotone"
            dataKey="upsell"
            name="Upsell"
            stroke="#623CC9"
            strokeWidth={2}
            fill="url(#fillUpsell)"
            dot={{ r: 4, fill: '#623CC9' }}
            activeDot={click ? { r: 6, onClick: (_, payload) => click(payload) } : { r: 6 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
