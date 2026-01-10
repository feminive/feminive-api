import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { verificarVoto, registrarVoto } from '../../src/services/enquetesService.js'
import { enqueteConsultaSchema, enqueteVotoSchema } from '../../src/validation/enquetes.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const parseConsultaQuery = (req: VercelRequest) => {
  const pollIdRaw = Array.isArray(req.query.pollId) ? req.query.pollId[0] : req.query.pollId
  const emailRaw = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email

  const parsed = enqueteConsultaSchema.safeParse({
    pollId: typeof pollIdRaw === 'string' ? decodeURIComponent(pollIdRaw) : '',
    email: typeof emailRaw === 'string' ? decodeURIComponent(emailRaw) : ''
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'Parâmetros inválidos'
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
    try {
      return JSON.parse(raw)
    } catch (err) {
      const parseError = new Error('JSON inválido')
      parseError.name = 'BAD_REQUEST'
      throw parseError
    }
  }

  return raw
}

const parseVotoBody = (req: VercelRequest) => {
  const parsedBody = parseBody(req)
  const parsed = enqueteVotoSchema.safeParse(parsedBody)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'Dados inválidos'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res, {
    methods: 'GET,POST,OPTIONS',
    allowHeaders: 'Content-Type, Authorization, X-Requested-With',
    allowCredentials: true,
    maxAgeSeconds: 86400
  })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    let query: ReturnType<typeof parseConsultaQuery>

    try {
      query = parseConsultaQuery(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        sendError(res, 400, err.message)
        return
      }

      sendError(res, 400, 'Parâmetros inválidos')
      return
    }

    try {
      const resultado = await verificarVoto(query.pollId, query.email)
      sendJson(res, 200, resultado)
    } catch (err: any) {
      if (err?.name === 'POLL_NOT_FOUND') {
        sendError(res, 404, 'Enquete não encontrada')
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        sendError(res, 500, 'Configure SUPABASE_SERVICE_ROLE_KEY com uma chave service_role válida')
        return
      }

      console.error('[enquetes][GET] Erro ao verificar voto', err)
      sendError(res, 500, 'Erro ao consultar voto')
    }

    return
  }

  if (req.method === 'POST') {
    let payload: ReturnType<typeof parseVotoBody>

    try {
      payload = parseVotoBody(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        sendError(res, 400, err.message)
        return
      }

      sendError(res, 400, 'Dados inválidos')
      return
    }

    try {
      const resultado = await registrarVoto(payload.pollId, payload.optionId, payload.email, payload.locale)
      sendJson(res, 201, resultado)
    } catch (err: any) {
      if (err?.name === 'POLL_NOT_FOUND') {
        sendError(res, 404, 'Enquete não encontrada')
        return
      }

      if (err?.name === 'OPTION_NOT_ALLOWED') {
        sendError(res, 400, 'Opção não pertence à enquete')
        return
      }

      if (err?.name === 'ALREADY_VOTED') {
        sendError(res, 409, 'Usuária já votou nesta enquete')
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        sendError(res, 500, 'Configure SUPABASE_SERVICE_ROLE_KEY com uma chave service_role válida')
        return
      }

      console.error('[enquetes][POST] Erro ao registrar voto', err)
      sendError(res, 500, 'Erro ao registrar voto')
    }

    return
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS')
  sendError(res, 405, 'Método não permitido')
}
