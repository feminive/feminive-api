import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  email: string
  voted_at: string
}

const TABELA_ENQUETES = 'poll_votes'

export const buscarVotoPorEnqueteEEmail = async (pollId: string, email: string): Promise<PollVote | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_ENQUETES)
    .select('id, poll_id, option_id, email, voted_at')
    .eq('poll_id', pollId)
    .eq('email', email)
    .maybeSingle()

  if (error != null) {
    throw error
  }

  return data ?? null
}

export const salvarVotoEnquete = async (pollId: string, optionId: string, email: string): Promise<PollVote> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABELA_ENQUETES)
    .insert({ poll_id: pollId, option_id: optionId, email })
    .select('id, poll_id, option_id, email, voted_at')
    .maybeSingle()

  if (error != null) {
    if ((error as any).code === '23505') {
      const conflict = new Error('ALREADY_VOTED')
      conflict.name = 'ALREADY_VOTED'
      throw conflict
    }

    throw error
  }

  if (data == null) {
    throw new Error('Falha ao registrar voto')
  }

  return data
}
