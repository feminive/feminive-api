import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface Comentario {
  id: string
  slug: string
  autor: string
  conteudo: string
  curtidas: number
  criado_em: string
  locale: 'br' | 'en'
}

const TABELA_COMENTARIOS = 'comentarios'
const TABELA_CURTIDAS = 'comentario_curtidas'

export const listarComentariosPorSlug = async (slug: string, locale: 'br' | 'en'): Promise<Comentario[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .select('id, slug, autor, conteudo, curtidas, criado_em, locale')
    .eq('slug', slug)
    .eq('locale', locale)
    .order('criado_em', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export const criarComentario = async (slug: string, autor: string, conteudo: string, locale: 'br' | 'en'): Promise<Comentario> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .insert({ slug, autor, conteudo, locale })
    .select('id, slug, autor, conteudo, curtidas, criado_em, locale')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data == null) {
    throw new Error('Falha ao criar comentário')
  }

  return data
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
