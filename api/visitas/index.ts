import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { obterVisitas, registrarVisita } from '../../src/services/visitasService.js'
import { visitaListQuerySchema, visitaRegistroSchema } from '../../src/validation/visitas.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const parseBody = (req: VercelRequest): any => {
  const raw = req.body

  if (raw == null) {
    return {}
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (err) {
      const parseError = new Error('corpo JSON inválido')
      parseError.name = 'BAD_REQUEST'
      throw parseError
    }
  }

  return raw
}

const parseVisitaBody = (req: VercelRequest) => {
  const body = parseBody(req)
  const parsed = visitaRegistroSchema.safeParse(body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'dados inválidos'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
}

const parseQuery = (req: VercelRequest) => {
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset
  const parsed = visitaListQuerySchema.safeParse({ limit: rawLimit, offset: rawOffset })

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
  applyCors(req, res, { methods: 'GET,POST,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
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
      const resultado = await obterVisitas(query.limit, query.offset)
      sendJson(res, 200, resultado)
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
        return
      }

      sendError(res, 500, 'erro ao carregar visitas')
    }

    return
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST,OPTIONS')
    sendError(res, 405, 'método não permitido')
    return
  }

  let payload: ReturnType<typeof parseVisitaBody>

  try {
    payload = parseVisitaBody(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      sendError(res, 400, err.message)
      return
    }

    sendError(res, 400, 'dados inválidos')
    return
  }

  try {
    const resultado = await registrarVisita(payload.data, payload.title, payload.novel, payload.locale, payload.tags)
    sendJson(res, 201, resultado)
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
      return
    }

    sendError(res, 500, 'erro ao registrar visita')
  }
}
