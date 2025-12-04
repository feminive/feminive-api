import {
  listarProgresso,
  obterLeitor,
  registrarProgresso,
  salvarLeitor,
  TopPostMaisLido,
  listarTopPostsMaisLidos,
  listarLeitoresComTags as listarLeitoresComTagsRepositorio
} from '../repositories/leitoresRepository.js'

const EMAILS_BLOQUEADOS_PROGRESSO = new Set([
  'cefasheli@gmail.com',
  'feminivefanfics@gmail.com'
])

const normalizeTags = (tags?: string[]): string[] | undefined => {
  if (!Array.isArray(tags)) return undefined

  const normalizadas: string[] = []
  const vistos = new Set<string>()

  for (const tag of tags) {
    if (typeof tag !== 'string') continue

    const limpa = tag.trim().toLowerCase()
    if (limpa.length === 0) continue
    if (vistos.has(limpa)) continue

    vistos.add(limpa)
    normalizadas.push(limpa)

    if (normalizadas.length >= 20) break
  }

  return normalizadas
}

export const buscarLeitor = async (email: string) => {
  const leitor = await obterLeitor(email)
  if (leitor == null) {
    const erro = new Error('LEITOR_NAO_ENCONTRADO')
    erro.name = 'LEITOR_NAO_ENCONTRADO'
    throw erro
  }

  return leitor
}

export const salvarApelidoLeitor = async (email: string, apelido: string, locale: 'br' | 'en' = 'br') => {
  const leitor = await salvarLeitor(email, apelido, locale)
  return {
    mensagem: 'apelido salvo bonitinho',
    leitor
  }
}

export const salvarProgressoLeitura = async (
  email: string,
  slug: string,
  progresso: number,
  concluido?: boolean,
  locale: 'br' | 'en' = 'br',
  tags?: string[]
) => {
  const emailNormalizado = email.trim().toLowerCase()
  const agora = new Date().toISOString()
  const tagsNormalizadas = normalizeTags(tags)

  if (EMAILS_BLOQUEADOS_PROGRESSO.has(emailNormalizado)) {
    // Evita salvar progresso para e-mails bloqueados, mas responde sucesso para ficar silencioso no front
    return {
      mensagem: 'progresso anotado, continua firme!',
      atualizadoEm: agora
    }
  }

  await registrarProgresso(emailNormalizado, {
    slug,
    progresso,
    concluido: concluido ?? progresso >= 1,
    atualizado_em: agora,
    locale,
    tags: tagsNormalizadas
  })

  return {
    mensagem: 'progresso anotado, continua firme!',
    atualizadoEm: agora
  }
}

export const listarProgressoLeitura = async (email: string, locale: 'br' | 'en' = 'br') => {
  const registros = await listarProgresso(email.trim().toLowerCase(), locale)

  const concluido: string[] = []
  const progresso: Record<string, { progresso: number, concluido: boolean, atualizadoEm: string, tags: string[] }> = {}
  const contagemTags = new Map<string, number>()

  for (const registro of registros) {
    progresso[registro.slug] = {
      progresso: registro.progresso,
      concluido: registro.concluido,
      atualizadoEm: registro.atualizado_em,
      tags: Array.isArray(registro.tags) ? registro.tags : []
    }

    if (registro.concluido) {
      concluido.push(registro.slug)
      const tagsUnicas = new Set<string>()
      for (const tag of registro.tags ?? []) {
        if (typeof tag !== 'string') continue
        const normalizada = tag.trim().toLowerCase()
        if (normalizada.length === 0) continue
        if (tagsUnicas.has(normalizada)) continue
        tagsUnicas.add(normalizada)
        contagemTags.set(normalizada, (contagemTags.get(normalizada) ?? 0) + 1)
      }
    }
  }

  const contosLidos = new Set(concluido).size
  const tagsMaisLidas = Array.from(contagemTags, ([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.tag.localeCompare(b.tag)
    })
    .slice(0, 10)

  return {
    concluidos: concluido,
    progresso,
    contosLidos,
    tagsMaisLidas
  }
}

export const obterTopPostsMaisLidos = async (limit = 10, locale: 'br' | 'en' = 'br'): Promise<TopPostMaisLido[]> => {
  return listarTopPostsMaisLidos(limit, locale)
}

export const listarLeitoresComTags = async (limit?: number, offset?: number) => {
  const { leitores, total } = await listarLeitoresComTagsRepositorio(limit, offset)
  return {
    mensagem: 'leitores com tags listados',
    leitores,
    total
  }
}
