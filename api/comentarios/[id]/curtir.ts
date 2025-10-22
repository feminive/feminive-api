import type { VercelRequest, VercelResponse } from '@vercel/node'
import { curtirComentario } from '../../../src/services/comentariosService.js'
import { comentarioCurtirSchema } from '../../../src/validation/comentarios.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:4173'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

const parseIdParam = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = comentarioCurtirSchema.safeParse({ id: decoded })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'id inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data.id
}

const getClientIp = (req: VercelRequest): string => {
  const header = typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'] : ''
  if (header !== '') {
    return header.split(',')[0].trim()
  }

  const socketIp = typeof req.socket?.remoteAddress === 'string' ? req.socket.remoteAddress : ''
  return socketIp !== '' ? socketIp : '0.0.0.0'
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

  let id: string
  try {
    id = parseIdParam(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(400).json({ mensagem: 'id inválido' })
    return
  }

  const ip = getClientIp(req)

  try {
    const resultado = await curtirComentario(id, ip)
    res.status(200).json(resultado)
  } catch (err: any) {
    if (err?.name === 'CURTIDA_JA_REGISTRADA') {
      res.status(429).json({ mensagem: 'calma aí, já contei essa curtida' })
      return
    }

    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro ao registrar curtida'
    res.status(500).json({ mensagem: message })
  }
}
