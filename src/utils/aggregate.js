export function groupByField(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field]
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
    const week = getISOWeekLabel(date)
    if (!weekMap[week]) {
      weekMap[week] = { week, churn: 0, enrollment: 0, upsell: 0 }
    }
    const type = row.signal_type
    if (type === 'churn' || type === 'enrollment' || type === 'upsell') {
      weekMap[week] = { ...weekMap[week], [type]: weekMap[week][type] + 1 }
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

function getISOWeekLabel(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
