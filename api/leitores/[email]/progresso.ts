import type { VercelRequest, VercelResponse } from '@vercel/node'
import { leitorEmailParamSchema, leitorProgressoBodySchema } from '../../../src/validation/leitores.js'
import { listarProgressoLeitura, salvarProgressoLeitura } from '../../../src/services/leitoresService.js'
import { sendError, sendJson } from '../../../src/utils/http.js'

const extrairEmail = (query: VercelRequest['query']) => {
  const valor = query.email
  if (Array.isArray(valor)) {
    return valor[0]
  }
  return valor
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  const emailRaw = extrairEmail(req.query)

  try {
    const { email } = leitorEmailParamSchema.parse({ email: emailRaw })

    if (req.method === 'POST') {
      try {
        const dados = leitorProgressoBodySchema.parse(req.body)
        const resultado = await salvarProgressoLeitura(email, dados.slug, dados.progresso, dados.concluido)
        sendJson(res, 201, resultado)
      } catch (error: any) {
        if (error?.issues != null) {
          sendError(res, 400, 'dados de progresso errados', error.issues)
          return
        }
        throw error
      }
      return
    }

    if (req.method === 'GET') {
      const resposta = await listarProgressoLeitura(email)
      sendJson(res, 200, { mensagem: 'progresso recuperado', ...resposta })
      return
    }

    sendError(res, 405, 'esse método não é aceito aqui')
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'e-mail estranho, confere', error.issues)
      return
    }

    console.error('Erro na rota de progresso', error)
    sendError(res, 500, 'quebrou geral por aqui, tenta depois')
  }
}
