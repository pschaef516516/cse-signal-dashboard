import { describe, it, expect } from 'vitest'
import {
  groupByField,
  countByField,
  bucketConfidence,
  groupByWeek,
  getUniqueOrgs,
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
