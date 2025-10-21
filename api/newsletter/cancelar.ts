import type { VercelRequest, VercelResponse } from '@vercel/node'
import { newsletterCancelarSchema } from '../../src/validation/newsletter.js'
import { cancelarNewsletter } from '../../src/services/newsletterService.js'
import { sendError, sendJson } from '../../src/utils/http.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'usa POST que dá bom')
    return
  }

  try {
    const { email, motivo } = newsletterCancelarSchema.parse(req.body)
    const resposta = await cancelarNewsletter(email, motivo)
    sendJson(res, 200, resposta)
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'dados zoado, confere aí', error.issues)
      return
    }

    console.error('Erro ao cancelar newsletter', error)
    sendError(res, 500, 'não rolou cancelar agora, tenta depois')
  }
}
