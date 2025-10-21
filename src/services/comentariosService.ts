import { criarComentario, listarComentariosPorSlug, registrarCurtida } from '../repositories/comentariosRepository.js'

export const obterComentarios = async (slug: string) => {
  const comentarios = await listarComentariosPorSlug(slug)
  return {
    mensagem: 'comentários carregados',
    comentarios
  }
}

export const criarNovoComentario = async (slug: string, autor: string, conteudo: string) => {
  const comentario = await criarComentario(slug, autor, conteudo)
  return {
    mensagem: 'comentário enviado, valeu demais!',
    comentario
  }
}

export const curtirComentario = async (id: string, ip: string) => {
  try {
    await registrarCurtida(id, ip)
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
