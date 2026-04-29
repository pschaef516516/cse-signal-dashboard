import { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts } from './api/supabase'
import { getUniqueOrgs } from './utils/aggregate'

import StatCard from './components/ui/StatCard'
import PlaceholderPanel from './components/ui/PlaceholderPanel'
import SectionHeader from './components/ui/SectionHeader'

import SignalVolumeChart from './components/charts/SignalVolumeChart'
import CommunityChart from './components/charts/CommunityChart'
import MatchRateChart from './components/charts/MatchRateChart'
import MatchByTypeChart from './components/charts/MatchByTypeChart'
import TopOrgsTable from './components/charts/TopOrgsTable'
import ConfidenceHistogram from './components/charts/ConfidenceHistogram'
import SeverityChart from './components/charts/SeverityChart'
import PostsVsSignalsChart from './components/charts/PostsVsSignalsChart'

function Panel({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {title && <p className="text-sm font-semibold text-gray-500 mb-4">{title}</p>}
      {children}
    </div>
  )
}

export default function App() {
  const [signals, setSignals] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading dashboard data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    )
  }

  const churnSignals = signals.filter((s) => s.signal_type === 'churn')
  const enrollUpsellSignals = signals.filter(
    (s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell'
  )
  const matchedSignals = signals.filter((s) => s.match_method != null)
  const matchRate =
    signals.length > 0 ? Math.round((matchedSignals.length / signals.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900">CSE Signal Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Community Signal Engine — Pipeline Performance</p>
      </div>

      <div className="px-8 py-6 space-y-8 max-w-screen-2xl mx-auto">

        <section>
          <SectionHeader title="Key Metrics" subtitle="All-time totals" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard title="Total Signals" value={signals.length} />
            <StatCard title="Posts Ingested" value={posts.length} />
            <StatCard
              title="Match Rate"
              value={`${matchRate}%`}
              subtitle={`${matchedSignals.length} of ${signals.length} matched`}
            />
            <StatCard
              title="Unique Pros Flagged"
              value={getUniqueOrgs(signals, ['churn'])}
              subtitle="Distinct orgs with churn signal"
            />
            <StatCard
              title="Unique Leads Routed"
              value={getUniqueOrgs(signals, ['enrollment', 'upsell'])}
              subtitle="Distinct orgs with enrollment/upsell"
            />
            <StatCard
              title="Churn Signals"
              value={churnSignals.length}
              subtitle={`${enrollUpsellSignals.length} enrollment/upsell`}
            />
          </div>
        </section>

        <section>
          <SectionHeader title="Signal Volume" subtitle="How many signals are being detected each week" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Signals by Week (churn / enrollment / upsell)">
              <SignalVolumeChart signals={signals} />
            </Panel>
            <Panel title="Posts Ingested vs Signals Generated (by date)">
              <PostsVsSignalsChart signals={signals} posts={posts} />
            </Panel>
          </div>
        </section>

        <section>
          <SectionHeader title="Signal Sources" subtitle="Which Facebook communities produce the most signals" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Signals by Community (source)">
              <CommunityChart signals={signals} />
            </Panel>
            <Panel title="Top Orgs by Signal Count">
              <TopOrgsTable signals={signals} />
            </Panel>
          </div>
        </section>

        <section>
          <SectionHeader title="Match Quality" subtitle="What % of signals were matched to a known HCP org" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Overall Match Rate">
              <MatchRateChart signals={signals} />
            </Panel>
            <Panel title="Matched vs Unmatched by Signal Type">
              <MatchByTypeChart signals={signals} />
            </Panel>
          </div>
        </section>

        <section>
          <SectionHeader title="Signal Quality" subtitle="Confidence scores and severity distribution" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Confidence Score Distribution">
              <ConfidenceHistogram signals={signals} />
            </Panel>
            <Panel title="Signals by Severity">
              <SeverityChart signals={signals} />
            </Panel>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Action Metrics"
            subtitle="Available after Routing Agent and Slack 'Mark Actioned' button are built"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </section>

      </div>
    </div>
  )
}
