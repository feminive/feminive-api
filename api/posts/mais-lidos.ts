import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { obterTopPostsMaisLidos } from '../../src/services/leitoresService.js'
import { topPostsQuerySchema, TOP_POSTS_DEFAULT_LIMIT } from '../../src/validation/posts.js'
import { sendError, sendJson } from '../../src/utils/http.js'

const parseQuery = (req: VercelRequest) => {
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const rawLocale = Array.isArray(req.query.locale) ? req.query.locale[0] : req.query.locale
  const parsed = topPostsQuerySchema.safeParse({ limit: rawLimit, locale: rawLocale })

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
  applyCors(req, res, { methods: 'GET,OPTIONS', allowHeaders: 'Content-Type' })

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
  const locale = query.locale

  try {
    const topPosts = await obterTopPostsMaisLidos(limit, locale)
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
