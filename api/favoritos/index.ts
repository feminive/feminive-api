import type { VercelRequest, VercelResponse } from '@vercel/node'
import { criarFavorito, obterFavoritos } from '../../src/services/favoritosService.js'
import {
  favoritoCriarSchema,
  favoritosListarSchema
} from '../../src/validation/favoritos.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://api.feminivefanfics.com.br',
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321',
  'http://127.0.0.1:4321'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')
}

const parseListarQuery = (req: VercelRequest) => {
  const { limit, offset, user_id: rawUserId } = req.query
  const parsed = favoritosListarSchema.safeParse({
    limit,
    offset,
    user_id: Array.isArray(rawUserId) ? rawUserId[0] : rawUserId
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const mensagem = issue?.message ?? 'parâmetros inválidos'
    const erro = new Error(mensagem)
    erro.name = 'BAD_REQUEST'
    throw erro
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
      const erro = new Error('JSON inválido')
      erro.name = 'BAD_REQUEST'
      throw erro
    }
  }

  return raw
}

const parseCriarBody = (req: VercelRequest) => {
  const body = parseBody(req)
  const parsed = favoritoCriarSchema.safeParse(body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const mensagem = issue?.message ?? 'dados inválidos'
    const erro = new Error(mensagem)
    erro.name = 'BAD_REQUEST'
    throw erro
  }

  return parsed.data
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    let parametros: ReturnType<typeof parseListarQuery>

    try {
      parametros = parseListarQuery(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        sendError(res, 400, err.message)
        return
      }

      sendError(res, 400, 'parâmetros inválidos')
      return
    }

    try {
      const resultado = await obterFavoritos(parametros.user_id, parametros.limit, parametros.offset)
      sendJson(res, 200, resultado)
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
        return
      }

      sendError(res, 500, 'erro ao listar favoritos')
    }

    return
  }

  if (req.method === 'POST') {
    let payload: ReturnType<typeof parseCriarBody>

    try {
      payload = parseCriarBody(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        sendError(res, 400, err.message)
        return
      }

      sendError(res, 400, 'dados inválidos')
      return
    }

    try {
      const favorito = await criarFavorito(payload.user_id, payload.post_slug)
      sendJson(res, 201, favorito)
    } catch (err: any) {
      if (err?.name === 'FAVORITO_DUPLICADO') {
        sendError(res, 409, 'favorito já existe para este post')
        return
      }

      if (err?.name === 'POST_NAO_ENCONTRADO') {
        sendError(res, 404, 'post não encontrado')
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
        return
      }

      sendError(res, 500, 'erro ao criar favorito')
    }

    return
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS')
  sendError(res, 405, 'método não permitido')
}
