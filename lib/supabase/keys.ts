export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
}

export function hasSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = getSupabasePublishableKey()
  // Treat placeholder values (not yet replaced by real credentials) as
  // unconfigured so the app stays usable instead of crashing every route.
  if (
    !url ||
    !key ||
    url.includes('REPLACE_ME') ||
    key.includes('REPLACE_ME')
  ) {
    return false
  }
  return true
}
