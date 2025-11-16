import {
  listarProgresso,
  obterLeitor,
  registrarProgresso,
  salvarLeitor,
  TopPostMaisLido,
  listarTopPostsMaisLidos
} from '../repositories/leitoresRepository.js'

const EMAILS_BLOQUEADOS_PROGRESSO = new Set([
  'cefasheli@gmail.com',
  'feminivefanfics@gmail.com'
])

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
  locale: 'br' | 'en' = 'br'
) => {
  const emailNormalizado = email.trim().toLowerCase()

  if (EMAILS_BLOQUEADOS_PROGRESSO.has(emailNormalizado)) {
    const erro = new Error('este e-mail não pode registrar progresso de leitura')
    erro.name = 'EMAIL_BLOQUEADO'
    throw erro
  }

  const agora = new Date().toISOString()
  await registrarProgresso(emailNormalizado, {
    slug,
    progresso,
    concluido: concluido ?? progresso >= 1,
    atualizado_em: agora,
    locale
  })

  return {
    mensagem: 'progresso anotado, continua firme!',
    atualizadoEm: agora
  }
}

export const listarProgressoLeitura = async (email: string, locale: 'br' | 'en' = 'br') => {
  const registros = await listarProgresso(email.trim().toLowerCase(), locale)

  const concluido: string[] = []
  const progresso: Record<string, { progresso: number, concluido: boolean, atualizadoEm: string }> = {}

  for (const registro of registros) {
    progresso[registro.slug] = {
      progresso: registro.progresso,
      concluido: registro.concluido,
      atualizadoEm: registro.atualizado_em
    }

    if (registro.concluido) {
      concluido.push(registro.slug)
    }
  }

  return {
    concluidos: concluido,
    progresso
  }
}

export const obterTopPostsMaisLidos = async (limit = 10, locale: 'br' | 'en' = 'br'): Promise<TopPostMaisLido[]> => {
  return listarTopPostsMaisLidos(limit, locale)
}
