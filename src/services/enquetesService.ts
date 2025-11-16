import { buscarVotoPorEnqueteEEmail, salvarVotoEnquete } from '../repositories/enquetesRepository.js'
import { getPollOptions } from '../lib/pollOptions.js'

const ensurePollExists = (pollId: string): string[] => {
  const options = getPollOptions(pollId)

  if (options == null) {
    const error = new Error('Enquete não configurada')
    error.name = 'POLL_NOT_FOUND'
    throw error
  }

  return options
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

export const verificarVoto = async (pollId: string, email: string) => {
  ensurePollExists(pollId)

  const normalizedEmail = normalizeEmail(email)
  const voto = await buscarVotoPorEnqueteEEmail(pollId, normalizedEmail)

  if (voto == null) {
    return { hasVoted: false }
  }

  return {
    hasVoted: true,
    optionId: voto.option_id
  }
}

export const registrarVoto = async (pollId: string, optionId: string, email: string, locale: 'br' | 'en' = 'br') => {
  const options = ensurePollExists(pollId)

  if (!options.includes(optionId)) {
    const error = new Error('Opção não pertence à enquete')
    error.name = 'OPTION_NOT_ALLOWED'
    throw error
  }

  const normalizedEmail = normalizeEmail(email)

  try {
    await salvarVotoEnquete(pollId, optionId, normalizedEmail, locale)
  } catch (err: any) {
    if (err?.name === 'ALREADY_VOTED') {
      const conflict = new Error('Usuária já votou nesta enquete')
      conflict.name = 'ALREADY_VOTED'
      throw conflict
    }

    throw err
  }

  return { success: true }
}
