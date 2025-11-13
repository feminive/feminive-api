import type { VercelRequest, VercelResponse } from '@vercel/node'
import { inscreverNewsletter } from '../../src/services/newsletterService.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://api.feminivefanfics.com.br',
  'http://localhost:4321',
  'http://localhost:3000'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

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
  applyCors(req, res)

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
