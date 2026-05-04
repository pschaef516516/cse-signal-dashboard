import { useEffect, useRef, useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { countByField } from '../../utils/aggregate'

function Panel({ title, accent, children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${accent ? `${accent}30` : '#E1E6F2'}`,
      borderLeft: accent ? `4px solid ${accent}` : '1px solid #E1E6F2',
      borderRadius: 12,
      padding: 20,
    }}>
      {title && (
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: '0 0 16px' }}>{title}</p>
      )}
      {children}
    </div>
  )
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? `${accent}08` : '#FFFFFF',
      border: `1px solid ${accent ? `${accent}30` : '#E1E6F2'}`,
      borderTop: accent ? `3px solid ${accent}` : '1px solid #E1E6F2',
      borderRadius: 12,
      padding: '16px 20px',
      flex: 1,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: accent ?? '#6B7487', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#15181D', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#6B7487', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

function AlertBanner({ count, pct }) {
  return (
    <div style={{ background: '#FFF1F4', border: '1px solid #F5C0CC', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>⚠</span>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#D81860', margin: 0 }}>
        {count} high-severity signals ({pct}%) need immediate CSE attention
      </p>
    </div>
  )
}

function ThemeCard({ theme, last }) {
  const dot = theme.sentiment === 'negative' ? '#D81860' : theme.sentiment === 'positive' ? '#00875A' : '#6B7487'
  return (
    <div style={{ padding: '14px 0', borderBottom: last ? 'none' : '1px solid #E1E6F2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#15181D', margin: 0, flex: 1 }}>{theme.title}</p>
        {theme.count > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: dot, background: `${dot}12`, borderRadius: 10, padding: '2px 8px' }}>
            ~{theme.count} signals
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#6B7487', margin: '0 0 0 16px', lineHeight: 1.6 }}>{theme.detail}</p>
    </div>
  )
}

const SUGGESTED_QUESTIONS = [
  'Which orgs have the most churn signals?',
  "What's driving high-severity signals?",
  'Which source has the highest volume?',
  'Top signal categories this period?',
]

function SignalChip({ orgName, signals, onSignalClick }) {
  const signal = signals.find(s => s.org_name === orgName) ?? signals.find(s => s.org_name?.toLowerCase().includes(orgName.toLowerCase()))

  if (!signal) return <span style={{ fontWeight: 600 }}>{orgName}</span>

  return (
    <button
      onClick={() => onSignalClick(signal)}
      style={{
        background: '#EEF3FF',
        border: '1px solid #C7D7FF',
        borderRadius: 6,
        padding: '1px 8px',
        fontSize: 12,
        fontWeight: 600,
        color: '#0061FF',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {orgName} ↗
    </button>
  )
}

function ChatMessage({ message, signals, onSignalClick }) {
  if (message.role === 'user') return <span>{message.text}</span>

  const parts = message.text.split(/\[SIGNAL:([^\]]+)\]/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 0
          ? <span key={i}>{part}</span>
          : <SignalChip key={i} orgName={part} signals={signals} onSignalClick={onSignalClick} />
      )}
    </>
  )
}

function ChatBar({ signals, onSignalClick }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const messagesRef = useRef(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  async function askQuestion(questionOverride) {
    const question = (questionOverride ?? input).trim()
    if (!question || chatLoading) return
    if (question.length > 500) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Question is too long (max 500 characters). Please shorten it.' }])
      return
    }
    if (!questionOverride) setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setChatLoading(true)

    try {
      // Context is only sent on the first message to avoid repeating it every turn
      const isFirst = history.length === 0
      const content = isFirst ? `${buildChatContext(signals)}\n\nQuestion: ${question}` : question

      // Cap at 6 messages (3 exchanges) to control token usage
      const newHistory = [...history, { role: 'user', content }]
      const cappedHistory = newHistory.slice(-6)

      let answer

      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
        if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY not set')
        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: CHAT_SYSTEM_PROMPT,
          messages: cappedHistory,
        })
        answer = msg.content?.[0]?.text ?? 'No response.'
      } else {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: cappedHistory, mode: 'chat' }),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        answer = data.analysis
      }

      setHistory([...cappedHistory, { role: 'assistant', content: answer }])
      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch (err) {
      console.error('Chat failed:', err)
      setMessages(prev => [...prev, { role: 'assistant', text: 'Could not get an answer. Try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ padding: '12px 20px', borderBottom: collapsed ? 'none' : '1px solid #E1E6F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7487', margin: 0 }}>Ask a Question</p>
        <span style={{ fontSize: 12, color: '#6B7487' }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {!collapsed && (
        <>
          <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid #F4F6FB' }}>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => askQuestion(q)}
                disabled={chatLoading}
                style={{
                  background: '#F4F6FB',
                  border: '1px solid #E1E6F2',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: '#6B7487',
                  cursor: chatLoading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <div ref={messagesRef} style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: m.role === 'user' ? '#0061FF' : '#F4F6FB',
                    color: m.role === 'user' ? '#FFFFFF' : '#15181D',
                    borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '10px 14px',
                    fontSize: 13,
                    lineHeight: 1.6,
                    maxWidth: '80%',
                  }}>
                    <ChatMessage message={m} signals={signals} onSignalClick={onSignalClick} />
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#F4F6FB', borderRadius: '12px 12px 12px 2px', padding: '10px 14px' }}>
                    <div className="ai-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!collapsed && (
        <div style={{ padding: 12, display: 'flex', gap: 8, borderTop: messages.length > 0 ? '1px solid #E1E6F2' : 'none' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askQuestion()}
            placeholder="Ask anything about these signals…"
            disabled={chatLoading}
            style={{
              flex: 1,
              border: '1px solid #E1E6F2',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              color: '#15181D',
              outline: 'none',
              background: chatLoading ? '#FAFBFF' : '#FFFFFF',
            }}
          />
          <button
            onClick={() => askQuestion()}
            disabled={chatLoading || !input.trim()}
            style={{
              background: chatLoading || !input.trim() ? '#E1E6F2' : '#0061FF',
              color: chatLoading || !input.trim() ? '#6B7487' : '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ask
          </button>
        </div>
      )}
    </div>
  )
}

const CACHE_KEY = 'cse_ai_insights'

export default function AIInsightsTab({ signals, onSignalClick }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [analyzedAt, setAnalyzedAt] = useState(null)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { analysis: a, analyzedAt: t } = JSON.parse(cached)
        setAnalysis(a)
        setAnalyzedAt(t)
        return
      }
    } catch { /* invalid cache — fall through */ }
    if (signals.length > 0) runAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runAnalysis() {
    if (loading) return
    sessionStorage.removeItem(CACHE_KEY)
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const summary = buildSummary(signals)
      const userMessage = buildUserMessage(summary)
      let raw

      if (import.meta.env.DEV) {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
        if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        })
        raw = msg.content?.[0]?.text ?? ''
      } else {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage }),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = await res.json()
        raw = data.analysis
      }

      const parsed = parseAnalysis(raw)
      if (!parsed) throw new Error('Could not parse response')
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ analysis: parsed, analyzedAt: time }))
      setAnalysis(parsed)
      setAnalyzedAt(time)
    } catch (err) {
      console.error('AI analysis failed:', err)
      setError('Could not load analysis. Click Re-analyze to try again.')
    } finally {
      setLoading(false)
    }
  }

  const metrics = buildMetrics(signals)
  const showAlert = metrics.highSeverityPct >= 35

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#15181D', margin: 0 }}>AI Signal Analysis</p>
          {analyzedAt && <p style={{ fontSize: 12, color: '#6B7487', margin: '3px 0 0' }}>Last analyzed at {analyzedAt}</p>}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            background: loading ? '#E1E6F2' : '#0061FF',
            color: loading ? '#6B7487' : '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Analyzing…' : 'Re-analyze'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <MetricCard label="Total Signals" value={metrics.total} accent="#0061FF" />
        <MetricCard label="Match Rate" value={`${metrics.matchRatePct}%`} sub={`${metrics.matched} matched`} accent={metrics.matchRatePct >= 70 ? '#00875A' : metrics.matchRatePct >= 50 ? '#F5A623' : '#D81860'} />
        <MetricCard label="High Severity" value={metrics.highSeverity} sub={`${metrics.highSeverityPct}% of signals`} accent="#D81860" />
        <MetricCard label="Churn vs E&U" value={`${metrics.churn} / ${metrics.eu}`} sub="churn / enrollment+upsell" accent="#7B61FF" />
      </div>

      {showAlert && <AlertBanner count={metrics.highSeverity} pct={metrics.highSeverityPct} />}

      {error && (
        <div style={{ background: '#FFF1F4', border: '1px solid #F5C0CC', borderRadius: 12, padding: '14px 20px' }}>
          <p style={{ color: '#D81860', fontSize: 14, margin: 0 }}>{error}</p>
        </div>
      )}

      {loading && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E1E6F2', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="ai-spinner" />
          <p style={{ color: '#6B7487', fontSize: 14, margin: 0 }}>
            Analyzing {Math.min(signals.filter(s => s.key_quote?.trim()).length, 500)} signal quotes…
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <div className="ai-skeleton" style={{ height: 14, width: '60%' }} />
            <div className="ai-skeleton" style={{ height: 14, width: '80%' }} />
            <div className="ai-skeleton" style={{ height: 14, width: '50%' }} />
          </div>
        </div>
      )}

      <ChatBar signals={signals} onSignalClick={onSignalClick} />

      {analysis && (
        <>
          {analysis.pipelineHealth && (
            <Panel title="Pipeline Health" accent="#00875A">
              <p style={{ fontSize: 15, fontWeight: 600, color: '#15181D', margin: '0 0 6px' }}>{analysis.pipelineHealth.headline}</p>
              <p style={{ fontSize: 14, color: '#6B7487', margin: 0, lineHeight: 1.7 }}>{analysis.pipelineHealth.body}</p>
            </Panel>
          )}

          {analysis.themes?.length > 0 && (
            <Panel title="What Pros Are Talking About" accent="#0061FF">
              {analysis.themes.map((t, i) => (
                <ThemeCard key={i} theme={t} last={i === analysis.themes.length - 1} />
              ))}
            </Panel>
          )}
        </>
      )}
    </div>
  )
}

const SYSTEM_PROMPT = `You are a CSE analyst at HousecallPro. Analyze signal pipeline data and community quotes to surface what pros are actually experiencing.

Focus on:
- pipelineHealth: 1-2 sentences on match rate quality and signal volume
- themes: 3-5 recurring themes from the community quotes — what are pros frustrated about, what do they want, what's driving churn? Group similar quotes. Include an estimated count of how many quotes belong to each theme.

Return ONLY valid JSON — no markdown fences, no explanation:
{"pipelineHealth":{"headline":"...","body":"..."},"themes":[{"title":"...","detail":"...","sentiment":"negative|positive|neutral","count":number}]}`

const CHAT_SYSTEM_PROMPT = `You are a CSE analyst at HousecallPro. Answer questions about the signal pipeline data concisely and directly. Plain English only, no markdown formatting, no bullet points. 2-3 sentences max unless more detail is genuinely needed. When referencing a specific org or signal, use the exact format [SIGNAL:Org Name Here] so the dashboard can link to it.`

function buildMetrics(signals) {
  const matched = signals.filter(s => s.match_method != null && s.match_method !== 'not_found')
  const highSev = signals.filter(s => s.severity === 'high')
  const churn = signals.filter(s => s.signal_type === 'churn')
  const eu = signals.filter(s => s.signal_type === 'enrollment' || s.signal_type === 'upsell')
  const total = signals.length
  return {
    total,
    matched: matched.length,
    matchRatePct: total > 0 ? Math.round((matched.length / total) * 100) : 0,
    highSeverity: highSev.length,
    highSeverityPct: total > 0 ? Math.round((highSev.length / total) * 100) : 0,
    churn: churn.length,
    eu: eu.length,
  }
}

function buildSummary(signals) {
  const metrics = buildMetrics(signals)
  const topSources = countByField(signals, 'source').slice(0, 3)
  const topCategories = countByField(signals, 'category').slice(0, 3)
  const keyQuotes = signals
    .filter(s => s.key_quote?.trim())
    .slice(0, 250)
    .map(s => s.key_quote.trim())
  return { date: new Date().toISOString().split('T')[0], ...metrics, topSources, topCategories, keyQuotes }
}

function buildUserMessage(summary) {
  return `Analyze this HousecallPro CSE signal pipeline as of ${summary.date}.

Stats:
- Total signals: ${summary.total}
- Match rate: ${summary.matchRatePct}% (${summary.matched} matched)
- High severity: ${summary.highSeverity} (${summary.highSeverityPct}%)
- Churn: ${summary.churn} | Enrollment+Upsell: ${summary.eu}
- Top sources: ${summary.topSources.map(s => `${s.name} (${s.count})`).join(', ')}
- Top categories: ${summary.topCategories.map(c => `${c.name} (${c.count})`).join(', ')}

Community signal quotes (${summary.keyQuotes.length} signals):
${summary.keyQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
}

function buildChatContext(signals) {
  const metrics = buildMetrics(signals)
  const topSources = countByField(signals, 'source').slice(0, 5)
  const topCategories = countByField(signals, 'category').slice(0, 5)
  const sampleQuotes = signals.filter(s => s.key_quote?.trim()).slice(0, 30).map(s => `[${s.org_name ?? 'Unknown'}] ${s.key_quote.trim()}`)
  return `Signal pipeline context:
- Total: ${metrics.total} signals | Match rate: ${metrics.matchRatePct}% | High severity: ${metrics.highSeverity} (${metrics.highSeverityPct}%)
- Churn: ${metrics.churn} | E&U: ${metrics.eu}
- Top sources: ${topSources.map(s => `${s.name} (${s.count})`).join(', ')}
- Top categories: ${topCategories.map(c => `${c.name} (${c.count})`).join(', ')}
- Sample quotes: ${sampleQuotes.map(q => `"${q}"`).join(' | ')}`
}

function parseAnalysis(raw) {
  try {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('no JSON found')
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}
