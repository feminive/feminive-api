import { getSupabaseClient } from '../lib/supabaseClient.js'

export interface VisitaRegistro {
  data: string
  title: string
  novel: string
  tags: string[]
}

const TABELA_VISITAS = 'visitas'

export const salvarVisita = async (registro: VisitaRegistro): Promise<void> => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from(TABELA_VISITAS)
    .insert({
      data: registro.data,
      title: registro.title,
      novel: registro.novel,
      tags: registro.tags
    })

  if (error != null) {
    throw error
  }
}
