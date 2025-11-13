import type { VercelRequest, VercelResponse } from '@vercel/node'
import { obterTopPostsMaisLidos } from '../../src/services/leitoresService.js'
import { topPostsQuerySchema, TOP_POSTS_DEFAULT_LIMIT } from '../../src/validation/posts.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://api.feminivefanfics.com.br',
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:4173'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
}

const parseQuery = (req: VercelRequest) => {
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const parsed = topPostsQuerySchema.safeParse({ limit: rawLimit })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'parâmetro limite inválido'
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

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET,OPTIONS')
    sendError(res, 405, 'método não permitido')
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

    sendError(res, 400, 'parâmetro limite inválido')
    return
  }

  const limit = query.limit ?? TOP_POSTS_DEFAULT_LIMIT

  try {
    const topPosts = await obterTopPostsMaisLidos(limit)
    sendJson(res, 200, {
      mensagem: 'ranking dos posts mais lidos pronto',
      topPosts
    })
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
      return
    }

    sendError(res, 500, 'erro ao buscar ranking de posts')
  }
}
