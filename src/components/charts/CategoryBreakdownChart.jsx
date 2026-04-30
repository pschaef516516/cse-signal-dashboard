// Horizontal bar chart showing signal counts by category.
// Clickable — clicking a bar calls onBarClick(categoryName) to open the Signal Navigator Modal.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { countByField } from '../../utils/aggregate'

// Strips type prefix (churn_ or enrollment_) and converts snake_case to Title Case.
// Example: "churn_price_complaint" → "Price Complaint"
function formatCategory(key) {
  if (!key) return 'Unknown'
  return key
    .replace(/^churn_|^enrollment_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const COLORS = ['#0057FF', '#3378FF', '#6699FF', '#99BBFF', '#B2CDFF']

// props:
//   signals    — array of signal objects to compute categories from
//   onBarClick — function(categoryName) called when a bar is clicked; omit for non-interactive
export default function CategoryBreakdownChart({ signals, onBarClick }) {
  const data = countByField(signals, 'category')
    .filter((d) => d.name != null)
    .slice(0, 10)

  if (data.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#6B7487', margin: 0 }}>No category data available.</p>
    )
  }

  // Dynamically size the chart so all bars are visible — 48px per row plus padding.
  const chartHeight = Math.max(200, data.length * 48 + 40)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        style={onBarClick ? { cursor: 'pointer' } : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6B7487' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={190}
          tick={{ fontSize: 11, fill: '#6B7487' }}
          tickFormatter={formatCategory}
        />
        <Tooltip
          formatter={(value) => [value, 'Signals']}
          labelFormatter={formatCategory}
        />
        <Bar
          dataKey="count"
          maxBarSize={28}
          onClick={onBarClick ? (entry) => onBarClick(entry.name) : undefined}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
