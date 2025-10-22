import { Buffer } from 'node:buffer'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Database = any

let cachedClient: SupabaseClient<Database> | null = null

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload)
  } catch (err) {
    return null
  }
}

const assertServiceRoleKey = (key: string): void => {
  const payload = decodeJwtPayload(key)

  if (payload?.role !== 'service_role') {
    const error = new Error('SUPABASE_SERVICE_ROLE_KEY não é uma chave service_role válida')
    error.name = 'SUPABASE_SERVICE_ROLE_KEY_INVALID'
    throw error
  }
}

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (cachedClient !== null) {
    return cachedClient
  }

  const url = process.env.SUPABASE_URL?.trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_KEY)?.trim()

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
  }

  assertServiceRoleKey(serviceKey)

  cachedClient = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedClient
}
