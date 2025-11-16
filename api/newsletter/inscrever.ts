import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { inscreverNewsletter } from '../../src/services/newsletterService.js'

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
  applyCors(req, res, { methods: 'POST,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS')
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
  const origem = typeof body?.origem === 'string' ? body.origem : undefined

  if (email === '') {
    res.status(400).json({ mensagem: 'dados inválidos: email é obrigatório' })
    return
  }

  try {
    const resultado = await inscreverNewsletter(email, origem)
    res.status(201).json({ mensagem: resultado.mensagem })
  } catch (err: any) {
    if (err?.name === 'ALREADY_SUBSCRIBED') {
      res.status(409).json({ mensagem: 'email já inscrito' })
      return
    }

    if (err?.name === 'SUPABASE_SERVICE_ROLE_REQUIRED' || err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro interno'
    res.status(500).json({ mensagem: message })
  }
}
