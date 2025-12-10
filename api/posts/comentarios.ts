import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { criarNovoComentario, obterComentarios } from '../../src/services/comentariosService.js'
import { comentarioCriarSchema, comentarioListarSchema } from '../../src/validation/comentarios.js'

const parseQueryParams = (req: VercelRequest) => {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug
  const slugDecoded = typeof rawSlug === 'string' ? decodeURIComponent(rawSlug) : ''
  const anchorType = Array.isArray(req.query.anchor_type) ? req.query.anchor_type[0] : req.query.anchor_type
  const paragraphId = Array.isArray(req.query.paragraph_id) ? req.query.paragraph_id[0] : req.query.paragraph_id
  const locale = Array.isArray(req.query.locale) ? req.query.locale[0] : req.query.locale

  const parsed = comentarioListarSchema.safeParse({
    slug: slugDecoded,
    anchor_type: typeof anchorType === 'string' ? anchorType : undefined,
    paragraph_id: typeof paragraphId === 'string' ? paragraphId : undefined,
    locale: typeof locale === 'string' ? locale : undefined
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'parâmetros inválidos'
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

  return { data: parsed.data, raw: body }
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res, { methods: 'GET,POST,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  let queryParams: ReturnType<typeof parseQueryParams>
  try {
    queryParams = parseQueryParams(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(400).json({ mensagem: 'parâmetros inválidos' })
    return
  }

  if (req.method === 'GET') {
    try {
      const { slug, locale, anchor_type, paragraph_id } = queryParams
      const filtros = anchor_type != null || paragraph_id != null
        ? { anchor_type, paragraph_id }
        : undefined
      const resultado = await obterComentarios(slug, locale, filtros)
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

    const { slug, locale } = queryParams
    const bodyLocaleProvided = payload.raw != null && Object.prototype.hasOwnProperty.call(payload.raw, 'locale')
    const payloadLocale = bodyLocaleProvided ? payload.data.locale : locale

    try {
      const resultado = await criarNovoComentario(slug, payload.data.autor, payload.data.conteudo, payloadLocale, {
        anchor_type: payload.data.anchor_type,
        paragraph_id: payload.data.paragraph_id,
        start_offset: payload.data.start_offset,
        end_offset: payload.data.end_offset,
        parent_id: payload.data.parent_id,
        quote: payload.data.quote
      }, payload.data.email)
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
