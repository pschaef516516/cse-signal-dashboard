import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek } from '../../utils/aggregate'

export default function SignalVolumeChart({ signals }) {
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="churn" stackId="a" fill="#D81860" name="Churn" />
        <Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" />
        <Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
