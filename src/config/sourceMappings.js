// Maps known source name variants to their canonical display name.
// Add new entries here whenever the pipeline produces a new variant.
const SOURCE_MAPPINGS = {
  'truck mount forums: carpet cleaning professionals': 'Truck Mount Forums',
}

export function normalizeSource(name) {
  if (!name) return 'Unknown'
  const key = name.toLowerCase().trim()
  return SOURCE_MAPPINGS[key] ?? name
}
