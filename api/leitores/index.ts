import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { listarLeitoresComTags } from '../../src/services/leitoresService.js'
import { leitoresListQuerySchema } from '../../src/validation/leitores.js'

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

  try {
    const resultado = await listarLeitoresComTags(query.limit, query.offset)
    res.status(200).json(resultado)
  } catch (err: any) {
    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro ao listar leitores'
    res.status(500).json({ mensagem: message })
  }
}
