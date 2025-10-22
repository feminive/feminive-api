import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface NewsletterInscricao {
  email: string
  origem: string | null
  criado_em: string
  cancelado_em: string | null
  motivo_cancelamento: string | null
}

const TABLE = 'newsletter_inscricoes'

const throwNormalizedError = (error: any): never => {
  const message = typeof error?.message === 'string' ? error.message : ''
  const code = typeof error?.code === 'string' ? error.code : ''

  if (code === '42501' || message.includes('row-level security policy')) {
    const err = new Error('SUPABASE_SERVICE_ROLE_REQUIRED')
    err.name = 'SUPABASE_SERVICE_ROLE_REQUIRED'
    throw err
  }

  throw error
}

export const findInscricaoPorEmail = async (email: string): Promise<NewsletterInscricao | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throwNormalizedError(error)
  }

  return data
}

export const criarInscricao = async (email: string, origem?: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABLE)
    .insert({ email, origem: origem ?? null })

  if (error) {
    throwNormalizedError(error)
  }
}

export const cancelarInscricao = async (email: string, motivo?: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABLE)
    .update({ cancelado_em: new Date().toISOString(), motivo_cancelamento: motivo ?? null })
    .eq('email', email)

  if (error) {
    throwNormalizedError(error)
  }
}
