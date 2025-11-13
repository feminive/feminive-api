import {
  listarProgresso,
  obterLeitor,
  registrarProgresso,
  salvarLeitor,
  TopPostMaisLido,
  listarTopPostsMaisLidos
} from '../repositories/leitoresRepository.js'

export const buscarLeitor = async (email: string) => {
  const leitor = await obterLeitor(email)
  if (leitor == null) {
    const erro = new Error('LEITOR_NAO_ENCONTRADO')
    erro.name = 'LEITOR_NAO_ENCONTRADO'
    throw erro
  }

  return leitor
}

export const salvarApelidoLeitor = async (email: string, apelido: string) => {
  const leitor = await salvarLeitor(email, apelido)
  return {
    mensagem: 'apelido salvo bonitinho',
    leitor
  }
}

export const salvarProgressoLeitura = async (email: string, slug: string, progresso: number, concluido?: boolean) => {
  const agora = new Date().toISOString()
  await registrarProgresso(email, {
    slug,
    progresso,
    concluido: concluido ?? progresso >= 1,
    atualizado_em: agora
  })

  return {
    mensagem: 'progresso anotado, continua firme!',
    atualizadoEm: agora
  }
}

export const listarProgressoLeitura = async (email: string) => {
  const registros = await listarProgresso(email)

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

export const obterTopPostsMaisLidos = async (limit = 10): Promise<TopPostMaisLido[]> => {
  return listarTopPostsMaisLidos(limit)
}
