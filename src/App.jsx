import React, { useEffect, useState } from 'react'
import { fetchSignals, fetchPosts } from './api/supabase'
import { getUniqueOrgs, getISOWeekLabel, formatWeekLabel } from './utils/aggregate'
import { getTodayRange, getYesterdayRange, getWeekRange, getMonthRange, filterByRange } from './utils/dateRanges'

import StatCard from './components/ui/StatCard'
import PlaceholderPanel from './components/ui/PlaceholderPanel'
import SectionHeader from './components/ui/SectionHeader'
import FilterPills from './components/ui/FilterPills'
import SignalModal from './components/ui/SignalModal'
import BrowseTab from './components/ui/BrowseTab'
import PipelineTab from './components/ui/PipelineTab'
import AIInsightsTab from './components/ui/AIInsightsTab'

import SignalVolumeChart from './components/charts/SignalVolumeChart'
import CommunityChart from './components/charts/CommunityChart'
import MatchRateChart from './components/charts/MatchRateChart'
import ConfidenceHistogram from './components/charts/ConfidenceHistogram'
import SeverityChart from './components/charts/SeverityChart'
import EnrollmentUpsellSplitChart from './components/charts/EnrollmentUpsellSplitChart'
import EUCommunityChart from './components/charts/EUCommunityChart'
import CategoryBreakdownChart from './components/charts/CategoryBreakdownChart'
import pillStyle from './components/ui/pillStyle'

class ChartErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return <p style={{ fontSize: 12, color: '#D81860', margin: 0 }}>Chart could not render.</p>
    }
    return this.props.children
  }
}

const TABS = [
  { id: 'churn', label: 'Churn' },
  { id: 'enrollment', label: 'Enrollment & Upsell' },
  { id: 'browse', label: 'Browse' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'ai', label: 'AI Insights' },
]

function Panel({ title, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 20 }}>
      {title && (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', marginBottom: 16 }}>{title}</p>
      )}
      <ChartErrorBoundary>{children}</ChartErrorBoundary>
    </div>
  )
}

export default function App() {
  const [signals, setSignals] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('churn')

  // Phase 03 — calendar-anchored time filter (per D-10, D-11). mode: 'all' = all-time.
  const [churnTimeFilter, setChurnTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })
  const [enrollmentTimeFilter, setEnrollmentTimeFilter] = useState({ mode: 'all', weekValue: null, monthValue: null })

  // Phase 04 — match filter state (D-03 to D-05). Per-tab, simple string.
  const [churnMatchFilter, setChurnMatchFilter] = useState('all')       // 'all' | 'matched' | 'unmatched'
  const [enrollmentMatchFilter, setEnrollmentMatchFilter] = useState('all')

  // Phase 03 — modal state (replaces drawer state)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSignals, setModalSignals] = useState([])
  const [modalIndex, setModalIndex] = useState(0)

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

  // Converts a { mode, weekValue, monthValue } filter object into a filtered array.
  // Routes to the correct date range helper based on mode.
  function filterByTimeFilter(rows, filter, dateField = 'created_at') {
    if (!filter || filter.mode === 'all') return rows
    if (filter.mode === 'today') {
      return filterByRange(rows, getTodayRange(), dateField)
    }
    if (filter.mode === 'yesterday') {
      return filterByRange(rows, getYesterdayRange(), dateField)
    }
    if (filter.mode === 'week') {
      const weekKey = filter.weekValue || null
      if (!weekKey) return rows  // no week selected yet — show all
      return filterByRange(rows, getWeekRange(weekKey), dateField)
    }
    if (filter.mode === 'month') {
      const monthKey = filter.monthValue || null
      if (!monthKey) return rows  // no month selected yet — show all
      return filterByRange(rows, getMonthRange(monthKey), dateField)
    }
    return rows
  }

  // Phase 03 — apply tab type filter, then calendar-anchored time filter (per D-10, D-11)
  const isChurn = activeTab === 'churn'
  const isBrowse = activeTab === 'browse'
  const isPipeline = activeTab === 'pipeline'
  const isAI = activeTab === 'ai'
  const activeTimeFilter = isChurn ? churnTimeFilter : enrollmentTimeFilter

  // Phase 04 — sub-7-day guard (D-06). Hide weekly chart when period is shorter than a week.
  const isSubWeek = activeTimeFilter.mode === 'today' || activeTimeFilter.mode === 'yesterday'

  const tabSignalsByType = isChurn
    ? signals.filter((s) => s.signal_type === 'churn')
    : signals.filter((s) => s.signal_type === 'enrollment')

  // tabSignals = tab-typed signals filtered by active calendar time filter
  const tabSignals = filterByTimeFilter(tabSignalsByType, activeTimeFilter)

  // Phase 04 — match filter applied AFTER time filter. Used ONLY by signal list / modal click handlers.
  // Stat cards and charts MUST keep using tabSignals (unfiltered by match) — see Pitfall 2 in RESEARCH.md.
  const activeMatchFilter = isChurn ? churnMatchFilter : enrollmentMatchFilter
  const displayedTabSignals = tabSignals.filter((s) => {
    if (activeMatchFilter === 'matched') return s.match_method != null && s.match_method !== 'not_found'
    if (activeMatchFilter === 'unmatched') return s.match_method === 'not_found'
    return true // 'all'
  })

  // Posts use captured_date — separate filter call (per RESEARCH.md Pitfall 1)
  const filteredPosts = filterByTimeFilter(posts, activeTimeFilter, 'captured_date')

  const filteredAllSignals = filterByTimeFilter(signals, activeTimeFilter)
  const signalRate = filteredPosts.length > 0
    ? Math.round((filteredAllSignals.length / filteredPosts.length) * 100)
    : 0

  // Stat card derivations — ALL must read from filtered tabSignals (D-02).
  const matchedSignals = tabSignals.filter(
    (s) => s.match_method != null && s.match_method !== 'not_found'
  )
  const matchRate = tabSignals.length > 0
    ? Math.round((matchedSignals.length / tabSignals.length) * 100)
    : 0

  const highSeverity = tabSignals.filter((s) => s.severity === 'high').length

  const preventableCount = tabSignals.filter((s) => s.preventability === 'high').length
  const preventablePct = tabSignals.length > 0
    ? Math.round((preventableCount / tabSignals.length) * 100)
    : 0

  // FIX (cross-AI review HIGH #2): uniqueOrgs must come from the FILTERED rows, not all signals.
  const uniqueOrgs = getUniqueOrgs(tabSignals, isChurn ? ['churn'] : ['enrollment'])

  // Phase 03 — modal open/close helpers
  function openModal(filteredSignals, startIndex = 0) {
    setModalSignals(filteredSignals)
    setModalIndex(startIndex)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  // Phase 03 — chart click handlers open modal instead of drawer
  // Phase 04 — handlers now use displayedTabSignals so modal respects the active match filter
  function handleCommunityClick(sourceName) {
    const filtered = displayedTabSignals.filter((s) => s.source === sourceName)
    openModal(filtered, 0)
  }

  function handleWeekClick(weekLabel) {
    const filtered = displayedTabSignals.filter((s) => {
      if (!s.created_at) return false
      return getISOWeekLabel(new Date(s.created_at)) === weekLabel
    })
    openModal(filtered, 0)
  }

  function handleSeverityClick(level) {
    const filtered = displayedTabSignals.filter((s) => s.severity === level)
    openModal(filtered, 0)
  }

  function handleCategoryClick(category) {
    const filtered = displayedTabSignals.filter((s) => s.category === category)
    openModal(filtered, 0)
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
            {!isBrowse && !isPipeline && !isAI && (
              <FilterPills
                value={isChurn ? churnTimeFilter : enrollmentTimeFilter}
                onChange={(newFilter) => {
                  if (isChurn) setChurnTimeFilter(newFilter)
                  else setEnrollmentTimeFilter(newFilter)
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px' }}>

        {!isBrowse && !isPipeline && !isAI && (
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
                <StatCard title="Signal Rate" value={`${signalRate}%`} subtitle="Posts converted to signals" />
                {isChurn && (
                  <StatCard
                    title="% Preventable Churn"
                    value={`${preventablePct}%`}
                    subtitle={`${preventableCount} of ${tabSignals.length} signals`}
                  />
                )}
                {!isChurn && (
                  <>
                    <StatCard title="Enrollment Signals" value={tabSignals.filter((s) => s.signal_type === 'enrollment' && s.category !== 'enrollment_upsell_opportunity').length} />
                    <StatCard title="Upsell Signals" value={tabSignals.filter((s) => s.category === 'enrollment_upsell_opportunity').length} />
                  </>
                )}
              </div>
            </div>

            {/* Phase 04 — Match filter pill row (D-03, D-04, D-05) */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7487' }}>Match status:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'matched', label: 'Matched' },
                  { value: 'unmatched', label: 'Unmatched' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => isChurn ? setChurnMatchFilter(opt.value) : setEnrollmentMatchFilter(opt.value)}
                    style={pillStyle(activeMatchFilter === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#6B7487', marginLeft: 'auto' }}>
                {displayedTabSignals.length} of {tabSignals.length} signals
              </span>
            </div>

            {/* Signal Volume */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Signal Volume" subtitle="Signals detected per week" />
              <Panel title="Signals by Week">
                {isSubWeek ? (
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#15181D', margin: 0, textAlign: 'center', padding: '24px 0' }}>
                    {displayedTabSignals.length}
                    <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7487', marginLeft: 8 }}>
                      signals {activeTimeFilter.mode === 'today' ? 'today' : 'yesterday'}
                    </span>
                  </p>
                ) : (
                  <SignalVolumeChart signals={displayedTabSignals} onBarClick={handleWeekClick} mode={isChurn ? 'churn' : 'eu'} />
                )}
              </Panel>
            </div>

            {/* Enrollment vs Upsell split — E&U tab only */}
            {!isChurn && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader title="Enrollment vs Upsell" subtitle="Volume by week, split by signal type" />
                <Panel title="Enrollment vs Upsell Volume Over Time">
                  <EnrollmentUpsellSplitChart signals={displayedTabSignals} />
                </Panel>
              </div>
            )}

            {/* Sources */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader title="Signal Sources" subtitle="Which communities produce the most signals" />
              {isChurn ? (
                <Panel title="Signals by Community">
                  <CommunityChart signals={displayedTabSignals} onBarClick={handleCommunityClick} />
                </Panel>
              ) : (
                <Panel title="Signal Sources by Type">
                  <EUCommunityChart signals={displayedTabSignals} onBarClick={handleCommunityClick} />
                </Panel>
              )}
            </div>

            {/* Signal Categories */}
            <div style={{ marginBottom: 32 }}>
              <SectionHeader
                title="Signal Categories"
                subtitle={isChurn ? 'Breakdown of churn signal categories' : 'Breakdown of enrollment signal categories'}
              />
              <Panel title="Click a category to view its signals">
                <CategoryBreakdownChart
                  signals={displayedTabSignals}
                  onBarClick={handleCategoryClick}
                />
              </Panel>
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
                  <SeverityChart signals={displayedTabSignals} onBarClick={handleSeverityClick} />
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

        {isBrowse && (
          <div style={{ marginBottom: 32 }}>
            <BrowseTab onSignalClick={(signal, allSignals) => {
              const list = allSignals && allSignals.length > 0 ? allSignals : [signal]
              const idx = list.indexOf(signal)
              openModal(list, idx >= 0 ? idx : 0)
            }} />
          </div>
        )}

        {isPipeline && (
          <div style={{ marginBottom: 32 }}>
            <PipelineTab signals={signals} posts={posts} />
          </div>
        )}

        <div style={{ display: isAI ? 'block' : 'none', marginBottom: 32 }}>
          <AIInsightsTab
            signals={signals}
            onSignalClick={(signal) => {
              setModalSignals(signals)
              setModalIndex(signals.indexOf(signal))
              setModalOpen(true)
            }}
          />
        </div>

      </div>

      <SignalModal
        open={modalOpen}
        signals={modalSignals}
        currentIndex={modalIndex}
        onClose={closeModal}
        onPrev={() => setModalIndex((i) => Math.max(0, i - 1))}
        onNext={() => setModalIndex((i) => Math.min(modalSignals.length - 1, i + 1))}
      />
    </div>
  )
}
