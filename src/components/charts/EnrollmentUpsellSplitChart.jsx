import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { groupByWeek, formatWeekLabel } from '../../utils/aggregate'

// Per D-13: stacked bar showing enrollment vs upsell volume over time.
// Data shape from groupByWeek: { week, churn, enrollment, upsell }.
// We render only enrollment + upsell. Not clickable per D-05.
export default function EnrollmentUpsellSplitChart({ signals }) {
  const data = groupByWeek(signals)

  if (data.length === 0) {
    return <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>No data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={formatWeekLabel} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={formatWeekLabel} />
        <Legend />
        <Bar dataKey="enrollment" stackId="a" fill="#0057FF" name="Enrollment" />
        <Bar dataKey="upsell" stackId="a" fill="#623CC9" name="Upsell" />
      </BarChart>
    </ResponsiveContainer>
  )
}
