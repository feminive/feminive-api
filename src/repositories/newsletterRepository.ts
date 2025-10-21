import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface NewsletterInscricao {
  email: string
  origem: string | null
  criado_em: string
  cancelado_em: string | null
  motivo_cancelamento: string | null
}

const TABLE = 'newsletter_inscricoes'

export const findInscricaoPorEmail = async (email: string): Promise<NewsletterInscricao | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const criarInscricao = async (email: string, origem?: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABLE)
    .insert({ email, origem: origem ?? null })

  if (error) {
    throw error
  }
}

export const cancelarInscricao = async (email: string, motivo?: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABLE)
    .update({ cancelado_em: new Date().toISOString(), motivo_cancelamento: motivo ?? null })
    .eq('email', email)

  if (error) {
    throw error
  }
}
