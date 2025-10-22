import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cancelarNewsletter } from '../../src/services/newsletterService.js'

const parseBody = (req: VercelRequest): any => {
  const raw = req.body

  if (raw == null) {
    return {}
  }

  if (typeof raw === 'string') {
    return JSON.parse(raw)
  }

  return raw
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ mensagem: 'Método não permitido' })
    return
  }

  let body: any
  try {
    body = parseBody(req)
  } catch (err: any) {
    res.status(400).json({ mensagem: 'corpo inválido: JSON malformado' })
    return
  }

  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const motivo = typeof body?.motivo === 'string' ? body.motivo : undefined

  if (email === '') {
    res.status(400).json({ mensagem: 'dados inválidos: email é obrigatório' })
    return
  }

  try {
    const resultado = await cancelarNewsletter(email, motivo)
    res.status(200).json({ mensagem: resultado.mensagem })
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_REQUIRED') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro interno'
    res.status(500).json({ mensagem: message })
  }
}
