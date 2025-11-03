import {
  inserirFavorito,
  listarFavoritosPorUsuario,
  removerFavorito,
  verificarPostPorSlug
} from '../repositories/favoritosRepository.js'

export const obterFavoritos = async (userId: string, limit: number, offset: number) => {
  const { registros, total } = await listarFavoritosPorUsuario(userId, limit, offset)

  return {
    data: registros,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + registros.length < total
    }
  }
}

export const criarFavorito = async (userId: string, postSlug: string) => {
  const existe = await verificarPostPorSlug(postSlug)

  if (!existe) {
    const erro = new Error('POST_NAO_ENCONTRADO')
    erro.name = 'POST_NAO_ENCONTRADO'
    throw erro
  }

  const favorito = await inserirFavorito(userId, postSlug)
  return favorito
}

export const excluirFavorito = async (userId: string, postSlug: string) => {
  const removido = await removerFavorito(userId, postSlug)

  if (!removido) {
    const erro = new Error('FAVORITO_NAO_ENCONTRADO')
    erro.name = 'FAVORITO_NAO_ENCONTRADO'
    throw erro
  }
}
