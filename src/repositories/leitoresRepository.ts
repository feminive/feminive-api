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
  tags?: string[]
}

export const registrarProgresso = async (email: string, registro: ProgressoRegistro): Promise<void> => {
  const supabase = getSupabaseClient()
  const payload: Record<string, any> = {
    email,
    slug: registro.slug,
    progresso: registro.progresso,
    concluido: registro.concluido,
    atualizado_em: registro.atualizado_em,
    locale: registro.locale
  }

  if (registro.tags !== undefined) {
    payload.tags = registro.tags
  }

  const { error } = await supabase
    .from(TABELA_PROGRESSO)
    .upsert(payload, { onConflict: 'email,slug,locale' })

  if (error) {
    throw error
  }
}

export const listarProgresso = async (email: string, locale: 'br' | 'en'): Promise<ProgressoRegistro[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_PROGRESSO)
    .select('slug, progresso, concluido, atualizado_em, locale, tags')
    .eq('email', email)
    .eq('locale', locale)

  if (error) {
    throw error
  }

  return data ?? []
}



export interface LeitorComTags {
  email: string
  apelido: string | null
  contosConcluidos: number
  tags: Array<{ tag: string, count: number }>
}

export interface LeitoresComTagsLista {
  leitores: LeitorComTags[]
  total: number
}



export const listarLeitoresComTags = async (limit?: number, offset?: number): Promise<LeitoresComTagsLista> => {
  const supabase = getSupabaseClient()
  const hasLimit = typeof limit === 'number' && Number.isFinite(limit)
  const safeLimit = hasLimit ? Math.min(200, Math.max(1, Math.floor(limit))) : 50
  const safeOffset = Math.max(0, Math.floor(offset ?? 0))

  const { data, error, count } = await supabase
    .rpc('leitores_com_tags', { p_limit: safeLimit, p_offset: safeOffset }, { count: 'exact' })

  if (error != null) {
    throw error
  }

  const leitores = (Array.isArray(data) ? data : []).map((item: any) => ({
    email: item?.email ?? '',
    apelido: item?.apelido ?? null,
    contosConcluidos: Number.isFinite(item?.contos_concluidos) ? Number(item.contos_concluidos) : 0,
    tags: Array.isArray(item?.tags_contagem)
      ? item.tags_contagem
          .filter((t: any) => typeof t?.tag === 'string' && Number.isFinite(t?.count))
          .map((t: any) => ({ tag: String(t.tag), count: Number(t.count) }))
      : []
  })).filter((item) => item.email.length > 0 && item.tags.length > 0)

  return {
    leitores,
    total: count ?? leitores.length
  }
}
