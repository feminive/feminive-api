import {
  criarComentario,
  listarTodosComentarios,
  listarComentariosPorSlug,
  registrarCurtida,
  deletarComentario,
  type ComentarioFiltro,
  type ComentarioAnchorPayload
} from '../repositories/comentariosRepository.js'

export const obterComentarios = async (slug: string, locale: 'br' | 'en' = 'br', filtros?: ComentarioFiltro) => {
  const comentarios = await listarComentariosPorSlug(slug, locale, filtros)
  return {
    mensagem: 'comentários carregados',
    comentarios
  }
}

export const obterTodosComentarios = async (params: {
  limit?: number
  offset?: number
  slug?: string
  locale?: 'br' | 'en'
  filtros?: ComentarioFiltro
} = {}) => {
  const { comentarios, total } = await listarTodosComentarios({
    limit: params.limit,
    offset: params.offset,
    slug: params.slug,
    locale: params.locale,
    filtro: params.filtros
  })

  return {
    mensagem: 'comentários carregados',
    comentarios,
    total
  }
}

export const criarNovoComentario = async (
  slug: string,
  autor: string,
  conteudo: string,
  locale: 'br' | 'en' = 'br',
  anchor?: ComentarioAnchorPayload,
  email?: string
) => {
  const comentario = await criarComentario(slug, autor, conteudo, locale, anchor, email)
  return {
    mensagem: 'comentário enviado, valeu demais!',
    comentario
  }
}

export const curtirComentario = async (id: string, ip: string, locale: 'br' | 'en' = 'br') => {
  try {
    await registrarCurtida(id, ip, locale)
  } catch (error: any) {
    if (error?.code === 'CURTIDA_JA_REGISTRADA') {
      const rate = new Error('CURTIDA_JA_REGISTRADA')
      rate.name = 'CURTIDA_JA_REGISTRADA'
      throw rate
    }

    throw error
  }

  return {
    mensagem: 'curtida registrada, obrigada!'
  }
}

export const removerComentario = async (id: string) => {
  const apagado = await deletarComentario(id)

  if (!apagado) {
    const notFound = new Error('comentário não encontrado')
    notFound.name = 'COMENTARIO_NAO_ENCONTRADO'
    throw notFound
  }

  return {
    mensagem: 'comentário removido'
  }
}
