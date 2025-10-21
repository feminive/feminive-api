import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface Leitor {
  email: string
  apelido: string
  atualizado_em: string
}

const TABELA_LEITORES = 'leitores'
const TABELA_PROGRESSO = 'leitura_progresso'

export const obterLeitor = async (email: string): Promise<Leitor | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_LEITORES)
    .select('email, apelido, atualizado_em')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const salvarLeitor = async (email: string, apelido: string): Promise<Leitor> => {
  const supabase = getSupabaseClient()
  const atualizado_em = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABELA_LEITORES)
    .upsert({ email, apelido, atualizado_em }, { onConflict: 'email' })
    .select('email, apelido, atualizado_em')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data == null) {
    throw new Error('Falha ao salvar leitor')
  }

  return data
}

export interface ProgressoRegistro {
  slug: string
  progresso: number
  concluido: boolean
  atualizado_em: string
}

export const registrarProgresso = async (email: string, registro: ProgressoRegistro): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABELA_PROGRESSO)
    .upsert({
      email,
      slug: registro.slug,
      progresso: registro.progresso,
      concluido: registro.concluido,
      atualizado_em: registro.atualizado_em
    }, { onConflict: 'email,slug' })

  if (error) {
    throw error
  }
}

export const listarProgresso = async (email: string): Promise<ProgressoRegistro[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_PROGRESSO)
    .select('slug, progresso, concluido, atualizado_em')
    .eq('email', email)

  if (error) {
    throw error
  }

  return data ?? []
}
