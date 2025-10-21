import type { VercelRequest, VercelResponse } from '@vercel/node'
import { newsletterInscreverSchema } from '../../src/validation/newsletter.js'
import { inscreverNewsletter } from '../../src/services/newsletterService.js'
import { sendError, sendJson } from '../../src/utils/http.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'usa o método certinho, por favor')
    return
  }

  try {
    const { email, origem } = newsletterInscreverSchema.parse(req.body)
    const resultado = await inscreverNewsletter(email, origem)
    sendJson(res, 201, resultado)
  } catch (error: any) {
    if (error?.name === 'ALREADY_SUBSCRIBED') {
      sendError(res, 409, 'esse e-mail já tá na lista, relaxa')
      return
    }

    if (error?.issues != null) {
      sendError(res, 400, 'dados inválidos', error.issues)
      return
    }

    console.error('Erro ao inscrever newsletter', error)
    sendError(res, 500, 'deu ruim por aqui, tenta de novo já já')
  }
}
