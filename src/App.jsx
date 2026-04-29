import { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts } from './api/supabase'
import { getUniqueOrgs } from './utils/aggregate'

import StatCard from './components/ui/StatCard'
import PlaceholderPanel from './components/ui/PlaceholderPanel'
import SectionHeader from './components/ui/SectionHeader'

import SignalVolumeChart from './components/charts/SignalVolumeChart'
import CommunityChart from './components/charts/CommunityChart'
import MatchRateChart from './components/charts/MatchRateChart'
import TopOrgsTable from './components/charts/TopOrgsTable'
import ConfidenceHistogram from './components/charts/ConfidenceHistogram'
import SeverityChart from './components/charts/SeverityChart'
import PostsVsSignalsChart from './components/charts/PostsVsSignalsChart'

const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
]

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

export default function App() {
  const [signals, setSignals] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('churn')

  useEffect(() => {
    async function load() {
      try {
        const [signalsData, postsData] = await Promise.all([fetchSignals(), fetchPosts()])
        setSignals(signalsData)
        setPosts(postsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B7487', fontSize: 14 }}>Loading dashboard data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#D81860', fontSize: 14 }}>Error: {error}</p>
      </div>
    )
  }

  const tabSignals = activeTab === 'churn'
    ? signals.filter((s) => s.signal_type === 'churn')
    : signals.filter((s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell')

  const isChurn = activeTab === 'churn'

  const matchedSignals = tabSignals.filter(
    (s) => s.match_method != null && s.match_method !== 'not_found'
  )
  const matchRate = tabSignals.length > 0
    ? Math.round((matchedSignals.length / tabSignals.length) * 100)
    : 0

  const highSeverity = tabSignals.filter((s) => s.severity === 'high').length
  const uniqueOrgs = isChurn
    ? getUniqueOrgs(signals, ['churn'])
    : getUniqueOrgs(signals, ['enrollment', 'upsell'])

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFF' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E1E6F2', padding: '20px 32px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 8, height: 32, background: '#0057FF', borderRadius: 4 }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: '#15181D', margin: 0 }}>CSE Signal Dashboard</h1>
              <p style={{ fontSize: 14, color: '#6B7487', margin: 0 }}>Community Signal Engine — Pipeline Performance</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? '#0057FF' : '#6B7487',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid #0057FF' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px' }}>

        {/* Key Metrics */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader
            title={isChurn ? 'Churn Signals' : 'Enrollment & Upsell Signals'}
            subtitle="All-time totals"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <StatCard title="Total Signals" value={tabSignals.length} />
            <StatCard
              title="Match Rate"
              value={`${matchRate}%`}
              subtitle={`${matchedSignals.length} of ${tabSignals.length} matched`}
            />
            <StatCard
              title={isChurn ? 'Unique Pros Flagged' : 'Unique Leads'}
              value={uniqueOrgs}
              subtitle={isChurn ? 'Distinct orgs with churn signal' : 'Distinct orgs with enrollment/upsell'}
            />
            <StatCard
              title="High Severity"
              value={highSeverity}
              subtitle={`${tabSignals.length > 0 ? Math.round((highSeverity / tabSignals.length) * 100) : 0}% of signals`}
            />
            <StatCard title="Posts Ingested" value={posts.length} subtitle="All communities" />
          </div>
        </div>

        {/* Pipeline Overview */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Pipeline Overview" subtitle="Posts ingested vs signals generated over time" />
          <Panel title="Posts Ingested vs Signals Generated">
            <PostsVsSignalsChart signals={signals} posts={posts} />
          </Panel>
        </div>

        {/* Signal Volume */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Signal Volume" subtitle="Signals detected per week" />
          <Panel title="Signals by Week">
            <SignalVolumeChart signals={tabSignals} />
          </Panel>
        </div>

        {/* Sources */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Signal Sources" subtitle="Which communities produce the most signals" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Panel title="Signals by Community">
              <CommunityChart signals={tabSignals} />
            </Panel>
            <Panel title="Top Orgs by Signal Count">
              <TopOrgsTable signals={tabSignals} />
            </Panel>
          </div>
        </div>

        {/* Match & Quality */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader title="Match & Signal Quality" subtitle="Match rate and confidence distribution" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Panel title="Overall Match Rate">
              <MatchRateChart signals={tabSignals} />
            </Panel>
            <Panel title="Confidence Score Distribution">
              <ConfidenceHistogram signals={tabSignals} />
            </Panel>
            <Panel title="Signals by Severity">
              <SeverityChart signals={tabSignals} />
            </Panel>
          </div>
        </div>

        {/* Action Metrics */}
        <div style={{ marginBottom: 32 }}>
          <SectionHeader
            title="Action Metrics"
            subtitle="Available after Routing Agent and Slack 'Mark Actioned' button are built"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <PlaceholderPanel
              title="Avg Time to Route"
              description="Time between signal detection and Routing Agent processing. Available after Routing Agent ships (routed_at column)."
            />
            <PlaceholderPanel
              title="Avg Time to Action"
              description="Time between signal detection and CSM clicking 'Mark Actioned'. Available after Slack button ships (actioned_at column)."
            />
            <PlaceholderPanel
              title="% Signals Actioned"
              description="Share of signals where a CSM took action. Available after Slack button ships (actioned_at column)."
            />
          </div>
        </div>

      </div>
    </div>
  )
}
