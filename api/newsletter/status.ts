import type { VercelRequest, VercelResponse } from '@vercel/node'
import { newsletterStatusSchema } from '../../src/validation/newsletter.js'
import { statusNewsletter } from '../../src/services/newsletterService.js'
import { sendError, sendJson } from '../../src/utils/http.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendError(res, 405, 'usa GET aqui, beleza?')
    return
  }

  try {
    const { email } = newsletterStatusSchema.parse(req.query)
    const status = await statusNewsletter(email)
    sendJson(res, 200, { mensagem: 'status na mão', ...status })
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'passa o e-mail direito', error.issues)
      return
    }

    console.error('Erro ao checar status newsletter', error)
    sendError(res, 500, 'algo quebrou aqui, mal aí')
  }
}
