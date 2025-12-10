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
}

export interface ComentarioFiltro {
  anchor_type?: ComentarioAnchor['anchor_type']
  paragraph_id?: string
}

export interface ComentarioAnchorPayload {
  anchor_type?: ComentarioAnchor['anchor_type']
  paragraph_id?: string | null
  start_offset?: number | null
  end_offset?: number | null
  quote?: string | null
}

const TABELA_COMENTARIOS = 'comentarios'
const TABELA_CURTIDAS = 'comentario_curtidas'

const normalizarComentario = (comentario: any): Comentario => {
  const anchor_type = (comentario?.anchor_type ?? 'general') as ComentarioAnchor['anchor_type']
  const paragraph_id = comentario?.paragraph_id ? String(comentario.paragraph_id) : null
  const start_offset = comentario?.start_offset != null ? Number(comentario.start_offset) : null
  const end_offset = comentario?.end_offset != null ? Number(comentario.end_offset) : null
  const quote = comentario?.quote ?? null
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
    ...(reanchored ? { reanchored } : {})
  }
}

export const listarComentariosPorSlug = async (
  slug: string,
  locale: 'br' | 'en',
  filtro?: ComentarioFiltro
): Promise<Comentario[]> => {
  const supabase = getSupabaseClient()

  let query = supabase
    .from(TABELA_COMENTARIOS)
    .select('id, slug, autor, conteudo, curtidas, criado_em, locale, anchor_type, paragraph_id, start_offset, end_offset, quote')
    .eq('slug', slug)
    .eq('locale', locale)

  if (filtro?.anchor_type != null) {
    query = query.eq('anchor_type', filtro.anchor_type)
  }

  if (filtro?.paragraph_id != null) {
    query = query.eq('paragraph_id', filtro.paragraph_id)
  }

  const { data, error } = await query.order('criado_em', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map(normalizarComentario)
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
    paragraph_id: anchor_type === 'inline' ? anchor?.paragraph_id ?? null : null,
    start_offset: anchor_type === 'inline' ? anchor?.start_offset ?? null : null,
    end_offset: anchor_type === 'inline' ? anchor?.end_offset ?? null : null,
    quote: anchor?.quote ?? null
  }

  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .insert(payload)
    .select('id, slug, autor, conteudo, curtidas, criado_em, locale, anchor_type, paragraph_id, start_offset, end_offset, quote')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data == null) {
    throw new Error('Falha ao criar comentário')
  }

  return normalizarComentario(data)
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
