import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import CommunityChart from '../charts/CommunityChart'
import { groupByWeek, getISOWeekLabel, formatWeekLabel } from '../../utils/aggregate'

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

function BigStat({ label, value, sub }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E1E6F2',
      borderRadius: 12,
      padding: '24px 28px',
      flex: 1,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7487', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 700, color: '#15181D', margin: '0 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#6B7487', margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function PipelineTab({ signals, posts }) {
  const weeklyData = groupByWeek(signals).map((row) => {
    const postCount = posts.filter((p) => {
      if (!p.captured_date) return false
      return getISOWeekLabel(new Date(p.captured_date)) === row.week
    }).length
    const signalCount = (row.churn || 0) + (row.enrollment || 0) + (row.upsell || 0)
    const total = signalCount + postCount
    const rate = total > 0 ? Math.round((signalCount / total) * 100) : 0
    return { week: formatWeekLabel(row.week), signalCount, postCount, rate }
  })

  const totalPosts = posts.length
  const totalSignals = signals.length
  const overallRate = totalPosts > 0 ? Math.round((totalSignals / totalPosts) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Top stats */}
      <div style={{ display: 'flex', gap: 16 }}>
        <BigStat
          label="Posts Ingested"
          value={totalPosts.toLocaleString()}
          sub="All-time community posts scraped"
        />
        <BigStat
          label="Signals Generated"
          value={totalSignals.toLocaleString()}
          sub="Posts flagged as churn or enrollment risk"
        />
        <BigStat
          label="Overall Conversion"
          value={`${overallRate}%`}
          sub="Posts that became a signal"
        />
      </div>

      {/* Conversion rate trend */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: '0 0 16px' }}>
          Signal Conversion Rate by Week
        </p>
        <Panel title="% of posts converted to signals each week">
          {weeklyData.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6B7487', margin: 0 }}>No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7487' }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7487' }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 'auto']}
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

      {/* Posts by source */}
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#15181D', margin: '0 0 16px' }}>
          Posts Ingested by Source
        </p>
        <Panel title="All communities">
          <CommunityChart signals={posts} onBarClick={undefined} label="Posts" />
        </Panel>
      </div>

    </div>
  )
}
