import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface VisitaRegistro {
  data: string
  title: string
  novel: string
  locale: 'en' | 'pt-BR'
  tags: string[]
}

const TABELA_VISITAS = 'visitas'

export const salvarVisita = async (registro: VisitaRegistro): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABELA_VISITAS)
    .insert({
      data: registro.data,
      title: registro.title,
      novel: registro.novel,
      locale: registro.locale,
      tags: registro.tags
    })

  if (error != null) {
    throw error
  }
}

export interface VisitaLista {
  visitas: VisitaRegistro[]
  total: number
}

export const listarVisitas = async (limit?: number, offset = 0): Promise<VisitaLista> => {
  const supabase = getSupabaseClient()
  const hasLimit = typeof limit === 'number' && Number.isFinite(limit)
  const safeLimit = hasLimit ? Math.max(1, Math.floor(limit)) : 500
  const safeOffset = Math.max(0, Math.floor(offset))

  const { data, error, count } = await supabase
    .from(TABELA_VISITAS)
    .select('data, title, novel, locale, tags', { count: 'exact' })
    .order('data', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1)

  if (error != null) {
    throw error
  }

  return {
    visitas: (data ?? []) as VisitaRegistro[],
    total: count ?? 0
  }
}
