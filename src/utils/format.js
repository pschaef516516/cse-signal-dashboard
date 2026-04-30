// Shared formatting helpers used across signal display components.

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

export function formatConfidence(c) {
  if (c === null || c === undefined) return '—'
  const num = Number(c)
  return isNaN(num) ? '—' : num.toFixed(2)
}
