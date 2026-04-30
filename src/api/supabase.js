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
    const body = await response.text().catch(() => '')
    throw new Error(`Supabase fetch failed: ${response.status} — ${body}`)
  }
  return response.json()
}

// Fetch all signals — only columns the dashboard needs.
// Phase 02 (D-08): added key_quote, summary, suggested_action for the SignalDetail view.
// limit=10000 overrides the default 1,000-row cap.
export async function fetchSignals() {
  return fetchSupabase(
    'signals?select=id,created_at,captured_date,signal_type,source,record_type,match_method,org_id,org_uuid,org_name,org_size,confidence,severity,preventability,routed_at,routing_reason,key_quote,summary,suggested_action,text,author_name,author_profile_url,post_url,parent_post_url,plan_name,plan_tier,enrollment_date,churn_date,vertical,phone,segment,active_subscriptions,status,customer_status,category,email,user_id&limit=10000'
  )
}

// Fetch all posts with pagination (server caps at 1,000 rows per request).
// Phase 02 (D-19): added id, org_name, content so the Browse tab can render
// posts list rows with an org column and a 120-char content preview.
export async function fetchPosts() {
  const PAGE_SIZE = 1000
  const all = []
  let offset = 0

  while (true) {
    const page = await fetchSupabase(
      `posts?select=id,captured_date,source,author_name,author_profile_url,post_url,record_type,text&limit=${PAGE_SIZE}&offset=${offset}`
    )
    all.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return all
}

// Phase 02 (D-15, D-17): Browse tab — fetch signals captured on a specific date.
// `date` is a "YYYY-MM-DD" string. We use PostgREST's gte/lt range on created_at
// to capture all signals whose timestamp falls on that calendar day (UTC boundary
// — acceptable for an internal dashboard).
export async function fetchSignalsByDate(date) {
  if (!date) return []
  const start = `${date}T00:00:00`
  const end = `${date}T23:59:59`
  return fetchSupabase(
    `signals?select=id,created_at,captured_date,signal_type,source,record_type,match_method,org_id,org_uuid,org_name,org_size,confidence,severity,preventability,routed_at,routing_reason,key_quote,summary,suggested_action,text,author_name,author_profile_url,post_url,parent_post_url,plan_name,plan_tier,enrollment_date,churn_date,vertical,phone,segment,active_subscriptions,status,customer_status,category,email,user_id&created_at=gte.${start}&created_at=lte.${end}&limit=10000`
  )
}

// Phase 02 (D-15, D-17): Browse tab — fetch posts captured on a specific date.
// `date` is a "YYYY-MM-DD" string. Posts use captured_date which is a date-only
// column, so we can use eq. directly.
export async function fetchPostsByDate(date) {
  if (!date) return []
  return fetchSupabase(
    `posts?select=id,captured_date,source,author_name,author_profile_url,post_url,record_type,text&captured_date=eq.${date}&limit=10000`
  )
}

// Browse tab — fetch signals within a date-time range (used for Week and Month granularity).
// startISO and endISO are full datetime strings: '2026-04-20T00:00:00' / '2026-04-26T23:59:59'
export async function fetchSignalsByRange(startISO, endISO) {
  if (!startISO || !endISO) return []
  return fetchSupabase(
    `signals?select=id,created_at,captured_date,signal_type,source,record_type,match_method,org_id,org_uuid,org_name,org_size,confidence,severity,preventability,routed_at,routing_reason,key_quote,summary,suggested_action,text,author_name,author_profile_url,post_url,parent_post_url,plan_name,plan_tier,enrollment_date,churn_date,vertical,phone,segment,active_subscriptions,status,customer_status,category,email,user_id&created_at=gte.${startISO}&created_at=lte.${endISO}&limit=10000`
  )
}

// Browse tab — fetch posts within a date range (used for Week and Month granularity).
// startDate and endDate are date-only strings: '2026-04-20' / '2026-04-26'
export async function fetchPostsByRange(startDate, endDate) {
  if (!startDate || !endDate) return []
  return fetchSupabase(
    `posts?select=id,captured_date,source,author_name,author_profile_url,post_url,record_type,text&captured_date=gte.${startDate}&captured_date=lte.${endDate}&limit=10000`
  )
}
