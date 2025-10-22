import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Database = any

let cachedClient: SupabaseClient<Database> | null = null

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (cachedClient !== null) {
    return cachedClient
  }

  const url = process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
  }

  cachedClient = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedClient
}
