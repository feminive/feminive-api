import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { obterTodosComentarios } from '../../src/services/comentariosService.js'
import { comentarioListarTodosSchema } from '../../src/validation/comentarios.js'

const parseQuery = (req: VercelRequest) => {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug
  const slugDecoded = typeof rawSlug === 'string' ? decodeURIComponent(rawSlug) : undefined
  const rawLocale = Array.isArray(req.query.locale) ? req.query.locale[0] : req.query.locale
  const rawAnchorType = Array.isArray(req.query.anchor_type) ? req.query.anchor_type[0] : req.query.anchor_type
  const rawParagraphId = Array.isArray(req.query.paragraph_id) ? req.query.paragraph_id[0] : req.query.paragraph_id
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset

  const parsed = comentarioListarTodosSchema.safeParse({
    slug: slugDecoded,
    locale: typeof rawLocale === 'string' ? rawLocale : undefined,
    anchor_type: typeof rawAnchorType === 'string' ? rawAnchorType : undefined,
    paragraph_id: typeof rawParagraphId === 'string' ? rawParagraphId : undefined,
    limit: rawLimit,
    offset: rawOffset
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

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res, { methods: 'GET,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET,OPTIONS')
    res.status(405).json({ mensagem: 'Método não permitido' })
    return
  }

  let query: ReturnType<typeof parseQuery>

  try {
    query = parseQuery(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(400).json({ mensagem: 'parâmetros inválidos' })
    return
  }

  const filtros = query.anchor_type != null || query.paragraph_id != null
    ? { anchor_type: query.anchor_type, paragraph_id: query.paragraph_id }
    : undefined

  try {
    const resultado = await obterTodosComentarios({
      limit: query.limit,
      offset: query.offset,
      slug: query.slug,
      locale: query.locale,
      filtros
    })
    res.status(200).json(resultado)
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro ao listar comentários'
    res.status(500).json({ mensagem: message })
  }
}
