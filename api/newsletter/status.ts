import type { VercelRequest, VercelResponse } from '@vercel/node'
import { statusNewsletter } from '../../src/services/newsletterService.js'

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ mensagem: 'Método não permitido' })
    return
  }

  const emailParam = req.query?.email
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam

  if (typeof email !== 'string' || email.trim() === '') {
    res.status(400).json({ mensagem: 'dados inválidos: email é obrigatório' })
    return
  }

  try {
    const resultado = await statusNewsletter(email.trim())
    res.status(200).json(resultado)
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_REQUIRED') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro interno'
    res.status(500).json({ mensagem: message })
  }
}
