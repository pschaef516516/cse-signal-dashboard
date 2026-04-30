// Date range utilities for the Browse tab granularity controls (Phase 03 Plan 02).
// Functions produce { start: Date, end: Date } pairs or arrays of ISO week/month strings.

// --- Internal helper (not exported) -----------------------------------------

// Compute the ISO week label ("YYYY-WXX") for a given Date object.
// Mirrors the logic in aggregate.js getISOWeekLabel to avoid a circular import.
function getISOWeekLabelLocal(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const year = d.getFullYear()
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// --- Week utilities ---------------------------------------------------------

// Returns an array of ISO week strings ('YYYY-WXX'), most recent first.
// count defaults to 12.
export function getRecentWeeks(count = 12) {
  const weeks = []
  const seen = new Set()
  const d = new Date()
  while (weeks.length < count) {
    const label = getISOWeekLabelLocal(d)
    if (!seen.has(label)) {
      seen.add(label)
      weeks.push(label)
    }
    d.setDate(d.getDate() - 1)
  }
  return weeks
}

// Returns { start: Date, end: Date } for a given ISO week string ('YYYY-WXX').
// start = Monday 00:00:00, end = Sunday 23:59:59 local time.
export function getWeekRange(isoWeek) {
  if (!isoWeek) return null
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)
  if (isNaN(year) || isNaN(week)) return null

  // Anchor: Jan 4 is always in ISO week 1.
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - dayOfWeek + 1)

  const start = new Date(week1Mon)
  start.setDate(week1Mon.getDate() + (week - 1) * 7)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// Returns a human-readable label like "Apr 20 – Apr 26" for a given 'YYYY-WXX' string.
export function formatWeekRangeLabel(isoWeek) {
  const { start, end } = getWeekRange(isoWeek)
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

// --- Month utilities --------------------------------------------------------

// Returns an array of 'YYYY-MM' strings, most recent first.
// count defaults to 12.
export function getRecentMonths(count = 12) {
  const months = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

// Returns { start: Date, end: Date } for a given 'YYYY-MM' string.
// start = first day of month 00:00:00, end = last day of month 23:59:59.
export function getMonthRange(yearMonth) {
  if (!yearMonth) return null
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // zero-indexed
  if (isNaN(year) || isNaN(month)) return null

  const start = new Date(year, month, 1, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999) // day 0 of next month = last day of this month

  return { start, end }
}

// Returns a human-readable label like "April 2026" for a given 'YYYY-MM' string.
export function formatMonthLabel(yearMonth) {
  if (!yearMonth) return ''
  const [yearStr, monthStr] = yearMonth.split('-')
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// --- Range filter utility ---------------------------------------------------

// Filters an array of rows to those where row[dateField] falls within [range.start, range.end].
// Returns rows unchanged if range is null.
export function filterByRange(rows, range, dateField = 'created_at') {
  if (!range) return rows
  return rows.filter((row) => {
    const d = new Date(row[dateField])
    return !isNaN(d) && d >= range.start && d <= range.end
  })
}

// --- Today / Yesterday utilities --------------------------------------------

// Returns { start: Date, end: Date } for today 00:00:00 through 23:59:59 local time.
export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { start, end }
}

// Returns { start: Date, end: Date } for yesterday 00:00:00 through 23:59:59 local time.
export function getYesterdayRange() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  return { start, end }
}
