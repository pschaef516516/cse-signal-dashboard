import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  groupByField,
  countByField,
  bucketConfidence,
  groupByWeek,
  getUniqueOrgs,
  filterByDateRange,
  groupBySourceAndType,
  getISOWeekLabel,
} from '../../src/utils/aggregate'

describe('groupByField', () => {
  it('groups rows by a field value', () => {
    const rows = [
      { type: 'churn' },
      { type: 'churn' },
      { type: 'enrollment' },
    ]
    const result = groupByField(rows, 'type')
    expect(result).toEqual({ churn: 2, enrollment: 1 })
  })

  it('returns empty object for empty array', () => {
    expect(groupByField([], 'type')).toEqual({})
  })
})

describe('countByField', () => {
  it('counts occurrences and sorts descending', () => {
    const rows = [
      { source: 'GroupA' },
      { source: 'GroupB' },
      { source: 'GroupA' },
      { source: 'GroupA' },
    ]
    const result = countByField(rows, 'source')
    expect(result[0]).toEqual({ name: 'GroupA', count: 3 })
    expect(result[1]).toEqual({ name: 'GroupB', count: 1 })
  })
})

describe('bucketConfidence', () => {
  it('buckets confidence scores into 0.1-wide bins', () => {
    const rows = [
      { confidence: 0.85 },
      { confidence: 0.92 },
      { confidence: 0.45 },
    ]
    const result = bucketConfidence(rows)
    const bucket08 = result.find((b) => b.range === '0.8–0.9')
    const bucket09 = result.find((b) => b.range === '0.9–1.0')
    const bucket04 = result.find((b) => b.range === '0.4–0.5')
    expect(bucket08.count).toBe(1)
    expect(bucket09.count).toBe(1)
    expect(bucket04.count).toBe(1)
  })
})

describe('groupByWeek', () => {
  it('groups rows by ISO week and signal type', () => {
    const rows = [
      { created_at: '2026-04-21T10:00:00Z', signal_type: 'churn' },
      { created_at: '2026-04-22T10:00:00Z', signal_type: 'enrollment' },
      { created_at: '2026-04-28T10:00:00Z', signal_type: 'churn' },
    ]
    const result = groupByWeek(rows)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]).toHaveProperty('week')
    expect(result[0]).toHaveProperty('churn')
    expect(result[0]).toHaveProperty('enrollment')
    expect(result[0]).toHaveProperty('upsell')
  })
})

describe('getUniqueOrgs', () => {
  it('returns distinct org_names for a given signal type', () => {
    const rows = [
      { org_name: 'Acme HVAC', signal_type: 'churn' },
      { org_name: 'Acme HVAC', signal_type: 'churn' },
      { org_name: 'Best Plumbing', signal_type: 'churn' },
      { org_name: 'Cool Co', signal_type: 'enrollment' },
    ]
    expect(getUniqueOrgs(rows, ['churn'])).toBe(2)
    expect(getUniqueOrgs(rows, ['enrollment', 'upsell'])).toBe(1)
  })

  it('ignores null org_names', () => {
    const rows = [
      { org_name: null, signal_type: 'churn' },
      { org_name: 'Acme HVAC', signal_type: 'churn' },
    ]
    expect(getUniqueOrgs(rows, ['churn'])).toBe(1)
  })
})

describe('filterByDateRange', () => {
  // Freeze "now" to 2026-06-15T12:00:00Z so tests are deterministic
  const FROZEN_NOW = new Date('2026-06-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN_NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const daysAgo = (n) => {
    const d = new Date(FROZEN_NOW)
    d.setDate(d.getDate() - n)
    return d.toISOString()
  }

  const rows = [
    { id: 1, created_at: daysAgo(1) },
    { id: 2, created_at: daysAgo(10) },
    { id: 3, created_at: daysAgo(45) },
    { id: 4, created_at: daysAgo(120) },
    { id: 5, created_at: 'not-a-date' },
  ]

  it('returns all rows when days is null', () => {
    expect(filterByDateRange(rows, null)).toHaveLength(5)
  })

  it('filters to last 7 days using created_at by default', () => {
    const result = filterByDateRange(rows, 7)
    expect(result.map((r) => r.id)).toEqual([1])
  })

  it('filters to last 30 days', () => {
    const result = filterByDateRange(rows, 30)
    expect(result.map((r) => r.id).sort()).toEqual([1, 2])
  })

  it('uses custom dateField when provided (captured_date)', () => {
    const posts = [
      { id: 'a', captured_date: daysAgo(2) },
      { id: 'b', captured_date: daysAgo(40) },
    ]
    const result = filterByDateRange(posts, 7, 'captured_date')
    expect(result.map((r) => r.id)).toEqual(['a'])
  })

  it('skips rows with invalid date strings', () => {
    const result = filterByDateRange(rows, 7)
    expect(result.find((r) => r.id === 5)).toBeUndefined()
  })
})

describe('groupBySourceAndType', () => {
  const rows = [
    { source: 'Reddit', signal_type: 'enrollment' },
    { source: 'Reddit', signal_type: 'enrollment' },
    { source: 'Reddit', signal_type: 'upsell' },
    { source: 'Slack', signal_type: 'upsell' },
    { source: 'Slack', signal_type: 'churn' },     // ignored
    { source: null, signal_type: 'enrollment' },     // ignored
    { source: 'Discord', signal_type: null },        // ignored
  ]

  it('returns array of {name, enrollment, upsell} with correct counts', () => {
    const result = groupBySourceAndType(rows)
    expect(result.find((r) => r.name === 'Reddit')).toEqual({ name: 'Reddit', enrollment: 2, upsell: 1 })
  })

  it('ignores churn signals', () => {
    const result = groupBySourceAndType(rows)
    expect(result.find((r) => r.name === 'Slack')).toEqual({ name: 'Slack', enrollment: 0, upsell: 1 })
  })

  it('ignores rows missing source or signal_type', () => {
    const result = groupBySourceAndType(rows)
    expect(result.find((r) => r.name == null)).toBeUndefined()
    expect(result.find((r) => r.name === 'Discord')).toBeUndefined()
  })

  it('sorts by total (enrollment + upsell) descending', () => {
    const result = groupBySourceAndType(rows)
    expect(result[0].name).toBe('Reddit')
    expect(result[1].name).toBe('Slack')
  })
})

describe('getISOWeekLabel', () => {
  it('is exported from aggregate.js', () => {
    expect(typeof getISOWeekLabel).toBe('function')
  })

  it('returns a string matching YYYY-Www pattern', () => {
    const label = getISOWeekLabel(new Date('2026-04-29'))
    expect(label).toMatch(/^\d{4}-W\d{2}$/)
  })
})
