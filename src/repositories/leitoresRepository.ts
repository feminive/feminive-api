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

export interface TopPostMaisLido {
  slug: string
  totalConcluidos: number
}

export interface LeitorComTags {
  email: string
  apelido: string | null
  tags: string[]
}

export interface LeitoresComTagsLista {
  leitores: LeitorComTags[]
  total: number
}

export const listarTopPostsMaisLidos = async (limit: number, locale: 'br' | 'en'): Promise<TopPostMaisLido[]> => {
  const supabase = getSupabaseClient()
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 10

  const { data, error } = await supabase
    .from(TABELA_PROGRESSO)
    .select('slug', { head: false })
    .eq('concluido', true)
    .eq('locale', locale)

  if (error != null) {
    throw error
  }

  const contagemPorSlug = new Map<string, number>()

  type RegistroSlug = Pick<ProgressoRegistro, 'slug'>
  const registros = (data ?? []) as Array<RegistroSlug | null>

  for (const registro of registros) {
    if (registro == null || typeof registro.slug !== 'string') {
      continue
    }

    const slug = registro.slug.trim()
    if (slug.length === 0) {
      continue
    }

    contagemPorSlug.set(slug, (contagemPorSlug.get(slug) ?? 0) + 1)
  }

  const agregados: TopPostMaisLido[] = Array.from(
    contagemPorSlug,
    ([slug, totalConcluidos]) => ({ slug, totalConcluidos })
  ).sort((a: TopPostMaisLido, b: TopPostMaisLido) => {
    if (b.totalConcluidos !== a.totalConcluidos) {
      return b.totalConcluidos - a.totalConcluidos
    }

    return a.slug.localeCompare(b.slug)
  })

  return agregados.slice(0, safeLimit)
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
    tags: Array.isArray(item?.tags) ? item.tags : []
  })).filter((item) => item.email.length > 0 && item.tags.length > 0)

  return {
    leitores,
    total: count ?? leitores.length
  }
}
