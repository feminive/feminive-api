import type { VercelRequest, VercelResponse } from '@vercel/node'
import { statusNewsletter } from '../../src/services/newsletterService.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      res.status(405).json({ ok: false, error: 'Método não permitido' })
      return
    }

    const emailParam = req.query?.email
    const email = Array.isArray(emailParam) ? emailParam[0] : emailParam

    if (typeof email !== 'string' || email.trim() === '') {
      res.status(400).json({ ok: false, error: 'email é obrigatório' })
      return
    }

    const resultado = await statusNewsletter(email.trim())

    res.status(200).json({ ok: true, ...resultado })
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'error'
    res.status(500).json({ ok: false, error: message })
  }
}
