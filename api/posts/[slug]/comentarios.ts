import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../../src/lib/cors.js'
import { criarNovoComentario, obterComentarios } from '../../../src/services/comentariosService.js'
import { comentarioCriarSchema, comentarioListarSchema, comentarioLocaleSchema } from '../../../src/validation/comentarios.js'

const parseSlugParam = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = comentarioListarSchema.safeParse({ slug: decoded })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'slug inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data.slug
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

const parseComentarioBody = (req: VercelRequest) => {
  const body = parseBody(req)
  const parsed = comentarioCriarSchema.safeParse(body)

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
  applyCors(req, res, { methods: 'GET,POST,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  let slug: string
  let locale: 'br' | 'en'
  try {
    slug = parseSlugParam(req)
    locale = parseLocaleQuery(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(400).json({ mensagem: 'slug inválido' })
    return
  }

  if (req.method === 'GET') {
    try {
      const resultado = await obterComentarios(slug, locale)
      res.status(200).json(resultado)
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao listar comentários'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  if (req.method === 'POST') {
    let payload: ReturnType<typeof parseComentarioBody>
    try {
      payload = parseComentarioBody(req)
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
      const resultado = await criarNovoComentario(slug, payload.autor, payload.conteudo, payloadLocale)
      res.status(201).json(resultado)
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao criar comentário'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS')
  res.status(405).json({ mensagem: 'Método não permitido' })
}
