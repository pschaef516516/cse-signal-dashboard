import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PostsVsSignalsChart from '../charts/PostsVsSignalsChart'
import CommunityChart from '../charts/CommunityChart'
import { groupByWeek, getISOWeekLabel, formatWeekLabel } from '../../utils/aggregate'

// Local Panel component — matches the Panel used in App.jsx
function Panel({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 20 }}>
      {title && (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', marginBottom: 16 }}>{title}</p>
      )}
      {children}
    </div>
  )
}

// PipelineTab — shows scraper health and ingestion metrics.
// Props:
//   signals — full all-signals array (both churn and enrollment)
//   posts   — full all-posts array
// No time filter is applied here: Pipeline always shows all-time data (D-14).
export default function PipelineTab({ signals, posts }) {
  // Build weekly data: for each ISO week with signals, count posts in that week and
  // compute the conversion rate (signals / (signals + posts)) as a percentage.
  const weeklyData = groupByWeek(signals).map((row) => {
    // Count posts whose captured_date falls in the same ISO week as row.week
    const postCount = posts.filter((p) => {
      if (!p.captured_date) return false
      return getISOWeekLabel(new Date(p.captured_date)) === row.week
    }).length
    const signalCount = (row.churn || 0) + (row.enrollment || 0) + (row.upsell || 0)
    const total = signalCount + postCount
    const rate = total > 0 ? Math.round((signalCount / total) * 100) : 0
    return {
      week: formatWeekLabel(row.week),
      signalCount,
      postCount,
      rate,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Section 1: Posts Ingested vs Signals Generated */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: '0 0 16px' }}>
          Posts Ingested vs Signals Generated
        </p>
        <Panel title="Weekly Volume">
          <PostsVsSignalsChart signals={signals} posts={posts} />
        </Panel>
      </div>

      {/* Section 2: Signal Conversion Rate by Week */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: '0 0 16px' }}>
          Signal Conversion Rate (%) by Week
        </p>
        <Panel title="% of posts converted to signals">
          {weeklyData.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6B7487', margin: 0 }}>No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#6B7487' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7487' }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip formatter={(v) => [`${v}%`, 'Conversion Rate']} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#0057FF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0057FF' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* Section 3: Posts Ingested by Source */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: '0 0 16px' }}>
          Posts Ingested by Source
        </p>
        {/* CommunityChart expects a "signals" prop but works for posts too — both have a source column.
            onBarClick is undefined because Pipeline tab has no drill-down (D-14). */}
        <Panel title="All communities">
          <CommunityChart signals={posts} onBarClick={undefined} label="Posts" />
        </Panel>
      </div>

    </div>
  )
}
