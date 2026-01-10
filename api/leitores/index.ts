import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { listarLeitoresComTags } from '../../src/services/leitoresService.js'
import { leitoresListQuerySchema } from '../../src/validation/leitores.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const parseQuery = (req: VercelRequest) => {
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset

  const parsed = leitoresListQuerySchema.safeParse({ limit: rawLimit, offset: rawOffset })

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
    sendError(res, 405, 'Método não permitido')
    return
  }

  let query: ReturnType<typeof parseQuery>

  try {
    query = parseQuery(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      sendError(res, 400, err.message)
      return
    }

    sendError(res, 400, 'parâmetros inválidos')
    return
  }

  try {
    const resultado = await listarLeitoresComTags(query.limit, query.offset)
    sendJson(res, 200, resultado)
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      sendError(res, 500, 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro ao listar leitores'
    sendError(res, 500, message)
  }
}
