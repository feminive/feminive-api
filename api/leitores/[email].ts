import type { VercelRequest, VercelResponse } from '@vercel/node'
import { leitorApelidoSchema, leitorEmailParamSchema } from '../../src/validation/leitores.js'
import { buscarLeitor, salvarApelidoLeitor } from '../../src/services/leitoresService.js'
import { sendError, sendJson } from '../../src/utils/http.js'

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

    if (req.method === 'GET') {
      try {
        const leitor = await buscarLeitor(email)
        sendJson(res, 200, { mensagem: 'achamos o leitor', leitor })
      } catch (error: any) {
        if (error?.name === 'LEITOR_NAO_ENCONTRADO') {
          sendError(res, 404, 'não achei ninguém com esse e-mail')
          return
        }
        throw error
      }
      return
    }

    if (req.method === 'PUT') {
      try {
        const { apelido } = leitorApelidoSchema.parse(req.body)
        const resultado = await salvarApelidoLeitor(email, apelido)
        sendJson(res, 200, resultado)
      } catch (error: any) {
        if (error?.issues != null) {
          sendError(res, 400, 'apelido inválido', error.issues)
          return
        }
        throw error
      }
      return
    }

    sendError(res, 405, 'método não permitido pra essa rota')
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'e-mail estranho, confere', error.issues)
      return
    }

    console.error('Erro na rota de leitor', error)
    sendError(res, 500, 'tivemos um bug aqui, foi mal')
  }
}
