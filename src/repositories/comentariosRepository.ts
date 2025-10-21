import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface Comentario {
  id: string
  slug: string
  autor: string
  conteudo: string
  curtidas: number
  criado_em: string
}

const TABELA_COMENTARIOS = 'comentarios'
const TABELA_CURTIDAS = 'comentario_curtidas'

export const listarComentariosPorSlug = async (slug: string): Promise<Comentario[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .select('id, slug, autor, conteudo, curtidas, criado_em')
    .eq('slug', slug)
    .order('criado_em', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export const criarComentario = async (slug: string, autor: string, conteudo: string): Promise<Comentario> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_COMENTARIOS)
    .insert({ slug, autor, conteudo })
    .select('id, slug, autor, conteudo, curtidas, criado_em')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data == null) {
    throw new Error('Falha ao criar comentário')
  }

  return data
}

export const registrarCurtida = async (comentarioId: string, ip: string): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error: insertError } = await supabase
    .from(TABELA_CURTIDAS)
    .insert({ comentario_id: comentarioId, ip })

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
