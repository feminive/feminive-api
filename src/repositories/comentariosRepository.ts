import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface ComentarioAnchor {
  anchor_type: 'general' | 'inline'
  paragraph_id: string | null
  start_offset: number | null
  end_offset: number | null
  quote: string | null
  reanchored?: boolean
}

export interface Comentario extends ComentarioAnchor {
  id: string
  slug: string
  autor: string
  conteudo: string
  curtidas: number
  criado_em: string
  locale: 'br' | 'en'
  parent_id: string | null
}

export interface ComentarioFiltro {
  anchor_type?: ComentarioAnchor['anchor_type']
  paragraph_id?: string
}

export interface ComentarioLista {
  comentarios: Comentario[]
  total: number
}

export interface ComentarioListaParams {
  limit?: number
  offset?: number
  slug?: string
  locale?: 'br' | 'en'
  filtro?: ComentarioFiltro
}

export interface ComentarioAnchorPayload {
  anchor_type?: ComentarioAnchor['anchor_type']
  paragraph_id?: string | null
  start_offset?: number | null
  end_offset?: number | null
  quote?: string | null
  parent_id?: string | null
}

const TABELA_COMENTARIOS = 'comentarios'
const TABELA_CURTIDAS = 'comentario_curtidas'
const PG_COLUMN_MISSING = '42703' // undefined column

const isColumnMissingError = (error: any): boolean => {
  return error?.code === PG_COLUMN_MISSING
}

const detectMissingColumn = (message?: string): string | null => {
  if (typeof message !== 'string') {
    return null
  }

  const match = message.match(/column "?([^"]+)"? does not exist/i)
  return match?.[1] ?? null
}

const normalizarComentario = (comentario: any): Comentario => {
  const anchor_type = (comentario?.anchor_type ?? 'general') as ComentarioAnchor['anchor_type']
  const paragraph_id = comentario?.paragraph_id ? String(comentario.paragraph_id) : null
  const start_offset = comentario?.start_offset != null ? Number(comentario.start_offset) : null
  const end_offset = comentario?.end_offset != null ? Number(comentario.end_offset) : null
  const quote = comentario?.quote ?? null
  const parent_id = comentario?.parent_id ? String(comentario.parent_id) : null
  let reanchored = false

  if (anchor_type === 'inline') {
    const inlineOk = paragraph_id != null &&
      paragraph_id !== '' &&
      start_offset != null &&
      end_offset != null &&
      !Number.isNaN(start_offset) &&
      !Number.isNaN(end_offset) &&
      start_offset >= 0 &&
      end_offset > start_offset

    if (!inlineOk) {
      reanchored = true
      return {
        ...comentario,
        anchor_type: 'general',
        paragraph_id: null,
        start_offset: null,
        end_offset: null,
        quote,
        parent_id,
        reanchored
      }
    }
  }

  return {
    ...comentario,
    anchor_type,
    paragraph_id,
    start_offset,
    end_offset,
    quote,
    parent_id,
    ...(reanchored ? { reanchored } : {})
  }
}

export const listarTodosComentarios = async (params: ComentarioListaParams = {}): Promise<ComentarioLista> => {
  const supabase = getSupabaseClient()
  const hasLimit = typeof params.limit === 'number' && Number.isFinite(params.limit)
  const safeLimit = hasLimit ? Math.min(500, Math.max(1, Math.floor(params.limit as number))) : 100
  const hasOffset = typeof params.offset === 'number' && Number.isFinite(params.offset)
  const safeOffset = hasOffset ? Math.max(0, Math.floor(params.offset as number)) : 0

  const buildQuery = (withAnchors: boolean, includeParentId = true) => {
    const baseColumns = 'id, slug, autor, conteudo, curtidas, criado_em, locale'
    const parentColumn = includeParentId ? ', parent_id' : ''
    const anchorColumns = withAnchors
      ? ', anchor_type, paragraph_id, start_offset, end_offset, quote'
      : ''

    let q = supabase
      .from(TABELA_COMENTARIOS)
      .select(`${baseColumns}${parentColumn}${anchorColumns}`, { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1)

    if (params.slug != null) {
      q = q.eq('slug', params.slug)
    }

    if (params.locale != null) {
      q = q.eq('locale', params.locale)
    }

    if (withAnchors && params.filtro?.anchor_type != null) {
      q = q.eq('anchor_type', params.filtro.anchor_type)
    }

    if (withAnchors && params.filtro?.paragraph_id != null) {
      q = q.eq('paragraph_id', params.filtro.paragraph_id)
    }

    return q
  }

  const attempt = await buildQuery(true, true)
  if (attempt.error != null) {
    if (!isColumnMissingError(attempt.error)) {
      throw attempt.error
    }

    const missingColumn = detectMissingColumn(attempt.error?.message)

    if (missingColumn === 'parent_id') {
      const parentlessAttempt = await buildQuery(true, false)
      if (parentlessAttempt.error != null) {
        throw parentlessAttempt.error
      }

      return {
        comentarios: (parentlessAttempt.data ?? []).map((comentario: any) =>
          normalizarComentario({
            ...comentario,
            parent_id: null
          })
        ),
        total: parentlessAttempt.count ?? (parentlessAttempt.data?.length ?? 0)
      }
    }

    // DB ainda sem colunas novas: faz fallback sem filtros de ancoragem (e sem parent_id)
    const fallback = await buildQuery(false, false)
    if (fallback.error != null) {
      throw fallback.error
    }

    return {
      comentarios: (fallback.data ?? []).map((comentario: any) =>
        normalizarComentario({
          ...comentario,
          anchor_type: 'general',
          paragraph_id: null,
          start_offset: null,
          end_offset: null,
          quote: null,
          parent_id: null
        })
      ),
      total: fallback.count ?? (fallback.data?.length ?? 0)
    }
  }

  return {
    comentarios: (attempt.data ?? []).map(normalizarComentario),
    total: attempt.count ?? (attempt.data?.length ?? 0)
  }
}

export const listarComentariosPorSlug = async (
  slug: string,
  locale: 'br' | 'en',
  filtro?: ComentarioFiltro
): Promise<Comentario[]> => {
  const supabase = getSupabaseClient()

  const buildQuery = (withAnchors: boolean, includeParentId = true) => {
    const baseColumns = 'id, slug, autor, conteudo, curtidas, criado_em, locale'
    const parentColumn = includeParentId ? ', parent_id' : ''
    const anchorColumns = withAnchors
      ? ', anchor_type, paragraph_id, start_offset, end_offset, quote'
      : ''

    let q = supabase
      .from(TABELA_COMENTARIOS)
      .select(`${baseColumns}${parentColumn}${anchorColumns}`)
      .eq('slug', slug)
      .eq('locale', locale)

    if (withAnchors && filtro?.anchor_type != null) {
      q = q.eq('anchor_type', filtro.anchor_type)
    }

    if (withAnchors && filtro?.paragraph_id != null) {
      q = q.eq('paragraph_id', filtro.paragraph_id)
    }

    return q.order('criado_em', { ascending: true })
  }

  const attempt = await buildQuery(true, true)
  if (attempt.error != null) {
    if (!isColumnMissingError(attempt.error)) {
      throw attempt.error
    }

    const missingColumn = detectMissingColumn(attempt.error?.message)

    if (missingColumn === 'parent_id') {
      const parentlessAttempt = await buildQuery(true, false)
      if (parentlessAttempt.error != null) {
        throw parentlessAttempt.error
      }

      return (parentlessAttempt.data ?? []).map((comentario: any) =>
        normalizarComentario({
          ...comentario,
          parent_id: null
        })
      )
    }

    // DB ainda sem colunas novas: faz fallback sem filtros de ancoragem (e sem parent_id)
    const fallback = await buildQuery(false, false)
    if (fallback.error != null) {
      throw fallback.error
    }

    return (fallback.data ?? []).map((comentario: any) =>
      normalizarComentario({
        ...comentario,
        anchor_type: 'general',
        paragraph_id: null,
        start_offset: null,
        end_offset: null,
        quote: null,
        parent_id: null
      })
    )
  }

  return (attempt.data ?? []).map(normalizarComentario)
}

export const criarComentario = async (
  slug: string,
  autor: string,
  conteudo: string,
  locale: 'br' | 'en',
  anchor?: ComentarioAnchorPayload
): Promise<Comentario> => {
  const supabase = getSupabaseClient()

  const anchor_type = anchor?.anchor_type ?? 'general'

  const payload = {
    slug,
    autor,
    conteudo,
    locale,
    anchor_type,
    parent_id: anchor?.parent_id ?? null,
    paragraph_id: anchor_type === 'inline' ? anchor?.paragraph_id ?? null : null,
    start_offset: anchor_type === 'inline' ? anchor?.start_offset ?? null : null,
    end_offset: anchor_type === 'inline' ? anchor?.end_offset ?? null : null,
    quote: anchor?.quote ?? null
  }

  const tentativa = await supabase
    .from(TABELA_COMENTARIOS)
    .insert(payload)
    .select('id, slug, autor, conteudo, curtidas, criado_em, locale, parent_id, anchor_type, paragraph_id, start_offset, end_offset, quote')
    .maybeSingle()

  if (tentativa.error != null) {
    if (!isColumnMissingError(tentativa.error)) {
      throw tentativa.error
    }

    // Fallback para esquema antigo (sem colunas de ancoragem)
    const fallbackPayload = { slug, autor, conteudo, locale }
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(TABELA_COMENTARIOS)
      .insert(fallbackPayload)
      .select('id, slug, autor, conteudo, curtidas, criado_em, locale')
      .maybeSingle()

    if (fallbackError != null) {
      throw fallbackError
    }

    if (fallbackData == null) {
      throw new Error('Falha ao criar comentário')
    }

    return normalizarComentario({
      ...fallbackData,
      anchor_type: 'general',
      paragraph_id: null,
      start_offset: null,
      end_offset: null,
      quote: null,
      parent_id: null
    })
  }

  if (tentativa.data == null) {
    throw new Error('Falha ao criar comentário')
  }

  return normalizarComentario(tentativa.data)
}

export const registrarCurtida = async (comentarioId: string, ip: string, locale: 'br' | 'en'): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error: insertError } = await supabase
    .from(TABELA_CURTIDAS)
    .insert({ comentario_id: comentarioId, ip, locale })

  if (insertError != null) {
    // 23505 = unique violation
    if ((insertError as any).code === '23505') {
      const rateError = new Error('CURTIDA_JA_REGISTRADA')
      ;(rateError as any).code = 'CURTIDA_JA_REGISTRADA'
      throw rateError
    }

    throw insertError
  }

  const { error: updateError } = await supabase.rpc('increment_comentario_curtidas', { comentario_id: comentarioId })

  if (updateError != null) {
    throw updateError
  }
}

export const deletarComentario = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error != null) {
    if ((error as any).code === 'PGRST116') {
      return false
    }

    throw error
  }

  return data != null
}
