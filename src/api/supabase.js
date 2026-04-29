const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
}

async function fetchSupabase(path) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Fetch all signals — only columns the dashboard needs
// limit=10000 overrides the default 1,000-row cap
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,signal_type,source,match_method,org_name,confidence,severity,routed_at,actioned_at&limit=10000'
  )
}

// Fetch all posts — only columns the dashboard needs
export async function fetchPosts() {
  return fetchSupabase('posts?select=captured_date,source&limit=10000')
}
