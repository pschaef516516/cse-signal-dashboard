export function groupByField(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field]
    if (key == null) return acc  // skip null and undefined
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}

export function countByField(rows, field) {
  const counts = groupByField(rows, field)
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function bucketConfidence(rows) {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
    count: 0,
  }))

  rows.forEach((row) => {
    const val = parseFloat(row.confidence)
    if (isNaN(val)) return
    const binIndex = Math.min(Math.floor(val * 10), 9)
    bins[binIndex] = { ...bins[binIndex], count: bins[binIndex].count + 1 }
  })

  return bins
}

export function groupByWeek(rows) {
  const weekMap = {}

  rows.forEach((row) => {
    const date = new Date(row.created_at)
    if (isNaN(date)) return  // skip rows with bad timestamps
    const week = getISOWeekLabel(date)
    if (!weekMap[week]) {
      weekMap[week] = { week, churn: 0, enrollment: 0, upsell: 0 }
    }
    const type = row.signal_type
    if (type === 'churn') {
      weekMap[week] = { ...weekMap[week], churn: weekMap[week].churn + 1 }
    } else if (type === 'enrollment') {
      const bucket = row.category === 'enrollment_upsell_opportunity' ? 'upsell' : 'enrollment'
      weekMap[week] = { ...weekMap[week], [bucket]: weekMap[week][bucket] + 1 }
    }
  })

  return Object.values(weekMap).sort((a, b) => (a.week > b.week ? 1 : -1))
}

export function getUniqueOrgs(rows, signalTypes) {
  const orgs = new Set(
    rows
      .filter((r) => signalTypes.includes(r.signal_type) && r.org_name != null)
      .map((r) => r.org_name)
  )
  return orgs.size
}

export function getISOWeekLabel(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// Converts an ISO week key ("2026-W17") to a human-readable label ("Apr 20").
// Jan 4 is always in ISO week 1, so we use it to anchor the Monday of week 1.
export function formatWeekLabel(isoWeek) {
  if (!isoWeek) return isoWeek
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)
  if (isNaN(year) || isNaN(week)) return isoWeek
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - dayOfWeek + 1)
  const targetMon = new Date(week1Mon)
  targetMon.setDate(week1Mon.getDate() + (week - 1) * 7)
  return targetMon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// New in Phase 02
//
// Date semantics: cutoff is `now - days * 24h`; rows whose dateField parses to a
// JavaScript Date >= cutoff are kept. For date-only strings like "2026-04-29",
// `new Date(...)` parses as 00:00 UTC, so a posts row with captured_date equal
// to today's date is included for any positive `days`. `days = null/undefined/0`
// returns the array unchanged ("All").
export function filterByDateRange(rows, days, dateField = 'created_at') {
  if (!days) return rows
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= cutoff
  })
}

export function groupBySourceAndType(rows) {
  const map = {}
  rows.forEach((row) => {
    const source = row.source
    const type = row.signal_type
    if (!source || !type) return
    if (!map[source]) {
      map[source] = { name: source, enrollment: 0, upsell: 0 }
    }
    if (type === 'enrollment') {
      const bucket = row.category === 'enrollment_upsell_opportunity' ? 'upsell' : 'enrollment'
      map[source] = { ...map[source], [bucket]: map[source][bucket] + 1 }
    }
  })
  return Object.values(map).sort((a, b) => (b.enrollment + b.upsell) - (a.enrollment + a.upsell))
}
