import type { VercelRequest, VercelResponse } from '@vercel/node'
import { listarProgressoLeitura, salvarProgressoLeitura } from '../../../src/services/leitoresService.js'
import { leitorEmailParamSchema, leitorLocaleSchema, leitorProgressoBodySchema } from '../../../src/validation/leitores.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://api.feminivefanfics.com.br',
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

const parseEmailParam = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = leitorEmailParamSchema.safeParse({ email: decoded })

  if (!parsed.success) {
    const primaryIssue = parsed.error.issues[0]
    const message = primaryIssue?.message ?? 'email inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data.email
}

const parseLocaleQuery = (req: VercelRequest): 'br' | 'en' => {
  const raw = Array.isArray(req.query.locale) ? req.query.locale[0] : req.query.locale
  const parsed = leitorLocaleSchema.safeParse(typeof raw === 'string' ? raw : undefined)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'locale inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
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

const parseProgressoBody = (req: VercelRequest) => {
  const body = parseBody(req)
  const parsed = leitorProgressoBodySchema.safeParse(body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'dados inválidos'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  let email: string
  let locale: 'br' | 'en'
  try {
    email = parseEmailParam(req)
    locale = parseLocaleQuery(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(500).json({ mensagem: 'erro ao processar e-mail' })
    return
  }

  if (req.method === 'GET') {
    try {
      const progresso = await listarProgressoLeitura(email, locale)
      res.status(200).json({
        email,
        ...progresso
      })
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao listar progresso'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  if (req.method === 'POST') {
    let payload: ReturnType<typeof parseProgressoBody>
    try {
      payload = parseProgressoBody(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        res.status(400).json({ mensagem: err.message })
        return
      }

      res.status(400).json({ mensagem: 'corpo inválido' })
      return
    }

    const payloadLocale = payload.locale ?? locale

    try {
      const resultado = await salvarProgressoLeitura(email, payload.slug, payload.progresso, payload.concluido, payloadLocale)
      res.status(201).json({
        mensagem: resultado.mensagem,
        atualizadoEm: resultado.atualizadoEm,
        slug: payload.slug
      })
    } catch (err: any) {
      if (err?.name === 'EMAIL_BLOQUEADO') {
        res.status(403).json({ mensagem: err.message ?? 'e-mail não autorizado a registrar progresso' })
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao salvar progresso'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS')
  res.status(405).json({ mensagem: 'Método não permitido' })
}
