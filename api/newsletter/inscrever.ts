import type { VercelRequest, VercelResponse } from '@vercel/node'
import { inscreverNewsletter } from '../../src/services/newsletterService.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ ok: false, error: 'Método não permitido' })
      return
    }

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body ?? {}

    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const origem = typeof body?.origem === 'string' ? body.origem : undefined

    if (email === '') {
      res.status(400).json({ ok: false, error: 'email é obrigatório' })
      return
    }

    const resultado = await inscreverNewsletter(email, origem)

    res.status(200).json({ ok: true, ...resultado })
  } catch (err: any) {
    if (err?.name === 'ALREADY_SUBSCRIBED') {
      res.status(409).json({ ok: false, error: 'email já inscrito' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'error'
    res.status(500).json({ ok: false, error: message })
  }
}
