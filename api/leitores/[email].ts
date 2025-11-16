import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors } from '../../src/lib/cors.js'
import { buscarLeitor, salvarApelidoLeitor } from '../../src/services/leitoresService.js'
import { leitorApelidoSchema, leitorEmailParamSchema } from '../../src/validation/leitores.js'

const parseEmailParam = (req: VercelRequest): string => {
  const raw = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email
  const decoded = typeof raw === 'string' ? decodeURIComponent(raw) : ''
  const parsed = leitorEmailParamSchema.safeParse({ email: decoded })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'email inválido'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data.email
}

const parseBody = (req: VercelRequest): any => {
  const raw = req.body

  if (raw == null) {
    return {}
  }

  if (typeof raw === 'string') {
    return JSON.parse(raw)
  }

  return raw
}

const parseApelidoBody = (req: VercelRequest) => {
  const body = parseBody(req)
  const parsed = leitorApelidoSchema.safeParse(body)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const message = issue?.message ?? 'dados inválidos'
    const error = new Error(message)
    error.name = 'BAD_REQUEST'
    throw error
  }

  return parsed.data
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(req, res, { methods: 'GET,PUT,OPTIONS', allowHeaders: 'Content-Type' })

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  let email: string
  try {
    email = parseEmailParam(req)
  } catch (err: any) {
    if (err?.name === 'BAD_REQUEST') {
      res.status(400).json({ mensagem: err.message })
      return
    }

    res.status(500).json({ mensagem: 'erro ao processar e-mail' })
    return
  }

  if (req.method === 'GET') {
    try {
      const leitor = await buscarLeitor(email)
      res.status(200).json({
        mensagem: 'achei esse fã aqui',
        leitor
      })
    } catch (err: any) {
      if (err?.name === 'LEITOR_NAO_ENCONTRADO') {
        res.status(404).json({ mensagem: 'não achei ninguém com esse e-mail' })
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao buscar leitor'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  if (req.method === 'PUT') {
    let payload: ReturnType<typeof parseApelidoBody>
    try {
      payload = parseApelidoBody(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        res.status(400).json({ mensagem: err.message })
        return
      }

      res.status(400).json({ mensagem: 'corpo inválido' })
      return
    }

    try {
      const resultado = await salvarApelidoLeitor(email, payload.apelido, payload.locale)
      res.status(200).json(resultado)
    } catch (err: any) {
      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ mensagem: 'erro interno: configure SUPABASE_SERVICE_ROLE_KEY com a service role do Supabase' })
        return
      }

      const message = typeof err?.message === 'string' ? err.message : 'erro ao salvar apelido'
      res.status(500).json({ mensagem: message })
    }
    return
  }

  res.setHeader('Allow', 'GET,PUT,OPTIONS')
  res.status(405).json({ mensagem: 'Método não permitido' })
}
