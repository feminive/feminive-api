import { listarVisitas, salvarVisita } from '../repositories/visitasRepository.js'

const normalizarTags = (tags?: string[]): string[] => {
  if (!Array.isArray(tags)) return []

  const vistos = new Set<string>()
  const normalizados: string[] = []

  for (const tag of tags) {
    if (typeof tag !== 'string') continue
    const t = tag.trim().toLowerCase()
    if (t.length === 0) continue
    if (vistos.has(t)) continue
    vistos.add(t)
    normalizados.push(t)
  }

  return normalizados
}

export const registrarVisita = async (data: string, title: string, novel: string, locale: 'en' | 'pt-BR', tags?: string[]) => {
  const tagsNormalizados = normalizarTags(tags)

  await salvarVisita({ data, title, novel, locale, tags: tagsNormalizados })

  return {
    mensagem: 'visita registrada, obrigada!'
  }
}

export const obterVisitas = async (limit?: number, offset?: number) => {
  const { visitas, total } = await listarVisitas(limit, offset)
  return {
    mensagem: 'visitas carregadas',
    visitas,
    total
  }
}
