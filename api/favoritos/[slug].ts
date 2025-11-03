import type { VercelRequest, VercelResponse } from '@vercel/node'
import { excluirFavorito } from '../../src/services/favoritosService.js'
import { favoritoSlugParamSchema, favoritoUsuarioSchema } from '../../src/validation/favoritos.js'
import { sendError } from '../../src/utils/http.js'

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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Vary', 'Origin')
}

const parseSlug = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = favoritoSlugParamSchema.safeParse({ slug: decoded })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const mensagem = issue?.message ?? 'slug inválido'
    const erro = new Error(mensagem)
    erro.name = 'BAD_REQUEST'
    throw erro
  }

  return parsed.data.slug
}

const parseUsuario = (req: VercelRequest): string => {
  const rawUserId = Array.isArray(req.query.user_id) ? req.query.user_id[0] : req.query.user_id
  const parsed = favoritoUsuarioSchema.safeParse({ user_id: rawUserId })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const mensagem = issue?.message ?? 'user_id inválido'
    const erro = new Error(mensagem)
    erro.name = 'BAD_REQUEST'
    throw erro
  }

  return parsed.data.user_id
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE,OPTIONS')
    sendError(res, 405, 'método não permitido')
    return
  }

  let slug: string
  let userId: string

  try {
    slug = parseSlug(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      sendError(res, 400, err.message)
      return
    }

    sendError(res, 400, 'slug inválido')
    return
  }

  try {
    userId = parseUsuario(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      sendError(res, 400, err.message)
      return
    }

    sendError(res, 400, 'user_id inválido')
    return
  }

  try {
    await excluirFavorito(userId, slug)
    res.status(204).end()
  } catch (err: any) {
    if (err?.name === 'FAVORITO_NAO_ENCONTRADO') {
      sendError(res, 404, 'favorito não encontrado')
      return
    }

    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      sendError(res, 500, 'configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase')
      return
    }

    sendError(res, 500, 'erro ao remover favorito')
  }
}
