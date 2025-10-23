import { cancelarInscricao, criarInscricao, findInscricaoPorEmail, deletarInscricao } from '../repositories/newsletterRepository.js'

export const inscreverNewsletter = async (email: string, origem?: string): Promise<{ mensagem: string }> => {
  const existente = await findInscricaoPorEmail(email)

  if (existente != null && existente.cancelado_em == null) {
    const error = new Error('ALREADY_SUBSCRIBED')
    error.name = 'ALREADY_SUBSCRIBED'
    throw error
  }

  if (existente != null && existente.cancelado_em != null) {
    await criarInscricao(email, origem)
    return { mensagem: 'assinatura reativada, valeu!' }
  }

  try {
    await criarInscricao(email, origem)
  } catch (err: any) {
    if (err.code === '23505') {
      const dup = new Error('ALREADY_SUBSCRIBED')
      dup.name = 'ALREADY_SUBSCRIBED'
      throw dup
    }

    throw err
  }

  return { mensagem: 'inscrição feita, fica de olho na caixa de entrada!' }
}

export const cancelarNewsletter = async (email: string, motivo?: string): Promise<{ mensagem: string }> => {
  await cancelarInscricao(email, motivo)
  return { mensagem: 'beleza, não vamos mais encher seu e-mail' }
}

export const statusNewsletter = async (email: string): Promise<{ inscrito: boolean, canceladoEm?: string | null }> => {
  const existente = await findInscricaoPorEmail(email)

  if (existente == null) {
    return { inscrito: false }
  }

  return {
    inscrito: existente.cancelado_em == null,
    canceladoEm: existente.cancelado_em
  }
}

export const removerNewsletter = async (email: string): Promise<{ mensagem: string }> => {
  await deletarInscricao(email)
  return { mensagem: 'inscrição removida permanentemente' }
}
