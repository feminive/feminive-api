import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../../src/lib/cors.js'
import { removerComentario } from '../../../src/services/comentariosService.js'
import { comentarioIdSchema } from '../../../src/validation/comentarios.js'

const parseIdParam = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = comentarioIdSchema.safeParse({ id: decoded })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'id inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data.id
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res, { methods: 'DELETE,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE,OPTIONS')
    res.status(405).json({ mensagem: 'Método não permitido' })
    return
  }

  let id: string
  try {
    id = parseIdParam(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(400).json({ mensagem: 'id inválido' })
    return
  }

  try {
    const resultado = await removerComentario(id)
    res.status(200).json(resultado)
  } catch (err: any) {
    if (err?.name === 'COMENTARIO_NAO_ENCONTRADO') {
      res.status(404).json({ mensagem: 'comentário não encontrado' })
      return
    }

    if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
      res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
      return
    }

    const message = typeof err?.message === 'string' ? err.message : 'erro ao remover comentário'
    res.status(500).json({ mensagem: message })
  }
}
