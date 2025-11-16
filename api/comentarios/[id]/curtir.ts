import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../../src/lib/cors.js'
import { curtirComentario } from '../../../src/services/comentariosService.js'
import { comentarioCurtirSchema, comentarioLocaleSchema } from '../../../src/validation/comentarios.js'

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

const parseLocaleQuery = (req: VercelRequest): 'br' | 'en' => {
  const raw = Array.isArray(req.query.locale) ? req.query.locale[0] : req.query.locale
  const parsed = comentarioLocaleSchema.safeParse(typeof raw === 'string' ? raw : undefined)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'locale inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
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

  let id: string
  let locale: 'br' | 'en'
  try {
    id = parseIdParam(req)
    locale = parseLocaleQuery(req)
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
    const resultado = await curtirComentario(id, ip, locale)
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
