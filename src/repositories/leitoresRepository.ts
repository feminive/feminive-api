import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface Leitor {
  email: string
  apelido: string
  atualizado_em: string
  locale: 'br' | 'en'
}

const TABELA_LEITORES = 'leitores'
const TABELA_PROGRESSO = 'leitura_progresso'

export const obterLeitor = async (email: string): Promise<Leitor | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_LEITORES)
    .select('email, apelido, atualizado_em, locale')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const salvarLeitor = async (email: string, apelido: string, locale: 'br' | 'en'): Promise<Leitor> => {
  const supabase = getSupabaseClient()
  const atualizado_em = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABELA_LEITORES)
    .upsert({ email, apelido, atualizado_em, locale }, { onConflict: 'email' })
    .select('email, apelido, atualizado_em, locale')
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
  locale: 'br' | 'en'
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
      atualizado_em: registro.atualizado_em,
      locale: registro.locale
    }, { onConflict: 'email,slug,locale' })

  if (error) {
    throw error
  }
}

export const listarProgresso = async (email: string, locale: 'br' | 'en'): Promise<ProgressoRegistro[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_PROGRESSO)
    .select('slug, progresso, concluido, atualizado_em, locale')
    .eq('email', email)
    .eq('locale', locale)

  if (error) {
    throw error
  }

  return data ?? []
}

export interface TopPostMaisLido {
  slug: string
  totalConcluidos: number
}

export const listarTopPostsMaisLidos = async (limit: number, locale: 'br' | 'en'): Promise<TopPostMaisLido[]> => {
  const supabase = getSupabaseClient()
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 10

  const { data, error } = await supabase
    .from(TABELA_PROGRESSO)
    .select('slug, total_concluidos:count()', { head: false })
    .eq('concluido', true)
    .eq('locale', locale)
    .group('slug')
    .order('total_concluidos', { ascending: false })
    .order('slug', { ascending: true })
    .limit(safeLimit)

  if (error != null) {
    throw error
  }

  const agregados = (data ?? [])
    .filter((registro: any) => typeof registro.slug === 'string' && registro.slug.length > 0)
    .map((registro: { slug: string, total_concluidos: number | string }) => ({
      slug: registro.slug,
      totalConcluidos: typeof registro.total_concluidos === 'string'
        ? Number.parseInt(registro.total_concluidos, 10) || 0
        : Number(registro.total_concluidos) || 0
    }))
    .sort((a, b) => {
      if (b.totalConcluidos !== a.totalConcluidos) {
        return b.totalConcluidos - a.totalConcluidos
      }

      return a.slug.localeCompare(b.slug)
    })

  return agregados.slice(0, safeLimit)
}
