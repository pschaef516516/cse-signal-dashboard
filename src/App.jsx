import { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts } from './api/supabase'
import { getUniqueOrgs, filterByDateRange, getISOWeekLabel } from './utils/aggregate'

import StatCard from './components/ui/StatCard'
import PlaceholderPanel from './components/ui/PlaceholderPanel'
import SectionHeader from './components/ui/SectionHeader'
import FilterPills from './components/ui/FilterPills'
import SignalDrawer from './components/ui/SignalDrawer'
import SignalDetail from './components/ui/SignalDetail'
import { SignalCardList } from './components/ui/SignalCard'

import SignalVolumeChart from './components/charts/SignalVolumeChart'
import CommunityChart from './components/charts/CommunityChart'
import MatchRateChart from './components/charts/MatchRateChart'
import ConfidenceHistogram from './components/charts/ConfidenceHistogram'
import SeverityChart from './components/charts/SeverityChart'
import PostsVsSignalsChart from './components/charts/PostsVsSignalsChart'
import EnrollmentUpsellSplitChart from './components/charts/EnrollmentUpsellSplitChart'
import EUCommunityChart from './components/charts/EUCommunityChart'

const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
  { id: 'browse', label: 'Browse' },
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

  // Phase 02 — time period filter (per D-02, D-03). null = All.
  const [churnFilter, setChurnFilter] = useState(null)
  const [enrollmentFilter, setEnrollmentFilter] = useState(null)

  // Phase 02 — drawer state (per D-04, D-07, D-09)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTitle, setDrawerTitle] = useState('')
  const [drawerSignals, setDrawerSignals] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)

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

  // Phase 02 — apply tab type filter, then date range filter (per D-02)
  const isChurn = activeTab === 'churn'
  const isBrowse = activeTab === 'browse'
  const activeFilter = isChurn ? churnFilter : enrollmentFilter

  const tabSignalsByType = isChurn
    ? signals.filter((s) => s.signal_type === 'churn')
    : signals.filter((s) => s.signal_type === 'enrollment' || s.signal_type === 'upsell')

  // tabSignals = tab-typed signals filtered by active date range
  const tabSignals = filterByDateRange(tabSignalsByType, activeFilter)

  // Posts use captured_date — separate filter call (per RESEARCH.md Pitfall 1)
  const filteredPosts = filterByDateRange(posts, activeFilter, 'captured_date')

  // All-signals filtered by date — used by PostsVsSignalsChart so its time series
  // respects the active filter (per D-02; cross-AI review HIGH #2 fix).
  const filteredAllSignals = filterByDateRange(signals, activeFilter)

  // Stat card derivations — ALL must read from filtered tabSignals (D-02).
  const matchedSignals = tabSignals.filter(
    (s) => s.match_method != null && s.match_method !== 'not_found'
  )
  const matchRate = tabSignals.length > 0
    ? Math.round((matchedSignals.length / tabSignals.length) * 100)
    : 0

  const highSeverity = tabSignals.filter((s) => s.severity === 'high').length

  // FIX (cross-AI review HIGH #2): uniqueOrgs must come from the FILTERED rows, not all signals.
  const uniqueOrgs = getUniqueOrgs(tabSignals, isChurn ? ['churn'] : ['enrollment', 'upsell'])

  // Phase 02 — drawer open/close helpers (per RESEARCH.md Pitfall 2)
  const tabLabel = isChurn ? 'Churn' : 'Enrollment & Upsell'

  function openDrawer(title, filteredSignals) {
    setDrawerTitle(title)
    setDrawerSignals(filteredSignals)
    setSelectedSignal(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelectedSignal(null)
  }

  // Phase 02 — chart click handlers (per D-05)
  function handleCommunityClick(sourceName) {
    const filtered = tabSignals.filter((s) => s.source === sourceName)
    openDrawer(`${sourceName} · ${tabLabel} Signals`, filtered)
  }

  function handleWeekClick(weekLabel) {
    const filtered = tabSignals.filter((s) => {
      if (!s.created_at) return false
      return getISOWeekLabel(new Date(s.created_at)) === weekLabel
    })
    openDrawer(`Week of ${weekLabel} · ${tabLabel} Signals`, filtered)
  }

  function handleSeverityClick(level) {
    const filtered = tabSignals.filter((s) => s.severity === level)
    const display = level ? level.charAt(0).toUpperCase() + level.slice(1) : level
    openDrawer(`${display} Severity · ${tabLabel} Signals`, filtered)
  }

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

          {/* Tabs + FilterPills in same row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {!isBrowse && (
              <FilterPills
                value={isChurn ? churnFilter : enrollmentFilter}
                onChange={(days) => {
                  if (isChurn) setChurnFilter(days)
                  else setEnrollmentFilter(days)
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px' }}>

        {!isBrowse && (
          <>
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
                <StatCard title="Posts Ingested" value={filteredPosts.length} subtitle="All communities" />
                {!isChurn && (
                  <>
                    <StatCard title="Enrollment Signals" value={tabSignals.filter((s) => s.signal_type === 'enrollment').length} />
                    <StatCard title="Upsell Signals" value={tabSignals.filter((s) => s.signal_type === 'upsell').length} />
                  </>
                )}
              </div>
            </div>

            {/* Pipeline Overview */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Pipeline Overview" subtitle="Posts ingested vs signals generated over time" />
              <Panel title="Posts Ingested vs Signals Generated">
                <PostsVsSignalsChart signals={filteredAllSignals} posts={filteredPosts} />
              </Panel>
            </div>

            {/* Signal Volume */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Signal Volume" subtitle="Signals detected per week" />
              <Panel title="Signals by Week">
                <SignalVolumeChart signals={tabSignals} onBarClick={handleWeekClick} />
              </Panel>
            </div>

            {/* Enrollment vs Upsell split — E&U tab only */}
            {!isChurn && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader title="Enrollment vs Upsell" subtitle="Volume by week, split by signal type" />
                <Panel title="Enrollment vs Upsell Volume Over Time">
                  <EnrollmentUpsellSplitChart signals={tabSignals} />
                </Panel>
              </div>
            )}

            {/* Sources */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Signal Sources" subtitle="Which communities produce the most signals" />
              {isChurn ? (
                <Panel title="Signals by Community">
                  <CommunityChart signals={tabSignals} onBarClick={handleCommunityClick} />
                </Panel>
              ) : (
                <Panel title="Signal Sources by Type">
                  <EUCommunityChart signals={tabSignals} onBarClick={handleCommunityClick} />
                </Panel>
              )}
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
                  <SeverityChart signals={tabSignals} onBarClick={handleSeverityClick} />
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
          </>
        )}

      </div>

      <SignalDrawer open={drawerOpen} title={drawerTitle} onClose={closeDrawer}>
        {selectedSignal ? (
          <SignalDetail signal={selectedSignal} onBack={() => setSelectedSignal(null)} />
        ) : (
          <SignalCardList signals={drawerSignals} onSelect={(s) => setSelectedSignal(s)} />
        )}
      </SignalDrawer>
    </div>
  )
}
