import { getSupabaseClient } from '../lib/supabaseClient.js'

const TABELA_FAVORITOS = 'user_favorites'
const TABELA_POSTS = process.env.POSTS_PUBLICADOS_TABELA?.trim() ?? 'posts_publicados'

export interface FavoritoRegistro {
  post_slug: string
  created_at: string
}

export const listarFavoritosPorUsuario = async (userId: string, limit: number, offset: number) => {
  const supabase = getSupabaseClient()
  const { data, error, count } = await supabase
    .from(TABELA_FAVORITOS)
    .select('post_slug, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error != null) {
    throw error
  }

  return {
    registros: data ?? [],
    total: count ?? 0
  }
}

export const inserirFavorito = async (userId: string, postSlug: string): Promise<FavoritoRegistro> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_FAVORITOS)
    .insert({ user_id: userId, post_slug: postSlug })
    .select('post_slug, created_at')
    .maybeSingle()

  if (error != null) {
    if ((error as any).code === '23505') {
      const duplicado = new Error('FAVORITO_DUPLICADO')
      duplicado.name = 'FAVORITO_DUPLICADO'
      throw duplicado
    }

    throw error
  }

  if (data == null) {
    throw new Error('Falha ao inserir favorito')
  }

  return data
}

export const removerFavorito = async (userId: string, postSlug: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from(TABELA_FAVORITOS)
    .delete()
    .eq('user_id', userId)
    .eq('post_slug', postSlug)
    .select('post_slug', { count: 'exact', head: true })

  if (error != null) {
    throw error
  }

  return (count ?? 0) > 0
}

export const verificarPostPorSlug = async (postSlug: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from(TABELA_POSTS)
      .select('slug')
      .eq('slug', postSlug)
      .maybeSingle()

    if (error != null) {
      // PGRST116 indica linha não encontrada, tratamos como inexistente
      if ((error as any).code === 'PGRST116') {
        return false
      }
      throw error
    }

    return data != null
  } catch (err: any) {
    // Erros de relação inexistente ou permissões: ignoramos validação
    const code = err?.code ?? err?.details

    if (code === '42P01' || err?.message?.includes('relation')) {
      return true
    }

    throw err
  }
}
