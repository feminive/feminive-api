import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verificarVoto, registrarVoto } from '../../src/services/enquetesService.js'
import { enqueteConsultaSchema, enqueteVotoSchema } from '../../src/validation/enquetes.js'

const ALLOWED_ORIGINS = [
  'https://www.feminivefanfics.com.br',
  'https://api.feminivefanfics.com.br',
  'https://feminive-fanfics.vercel.app',
  'http://localhost:4321',
  'http://localhost:5173',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173'
]

const applyCors = (req: VercelRequest, res: VercelResponse): void => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : ''
  const allowedOrigin = origin !== '' && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
}

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
  applyCors(req, res)

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
        res.status(400).json({ message: err.message })
        return
      }

      res.status(400).json({ message: 'Parâmetros inválidos' })
      return
    }

    try {
      const resultado = await verificarVoto(query.pollId, query.email)
      res.status(200).json(resultado)
    } catch (err: any) {
      if (err?.name === 'POLL_NOT_FOUND') {
        res.status(404).json({ message: 'Enquete não encontrada' })
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ message: 'Configure SUPABASE_SERVICE_ROLE_KEY com uma chave service_role válida' })
        return
      }

      console.error('[enquetes][GET] Erro ao verificar voto', err)
      res.status(500).json({ message: 'Erro ao consultar voto' })
    }

    return
  }

  if (req.method === 'POST') {
    let payload: ReturnType<typeof parseVotoBody>

    try {
      payload = parseVotoBody(req)
    } catch (err: any) {
      if (err?.name === 'BAD_REQUEST') {
        res.status(400).json({ message: err.message })
        return
      }

      res.status(400).json({ message: 'Dados inválidos' })
      return
    }

    try {
      const resultado = await registrarVoto(payload.pollId, payload.optionId, payload.email)
      res.status(201).json(resultado)
    } catch (err: any) {
      if (err?.name === 'POLL_NOT_FOUND') {
        res.status(404).json({ message: 'Enquete não encontrada' })
        return
      }

      if (err?.name === 'OPTION_NOT_ALLOWED') {
        res.status(400).json({ message: 'Opção não pertence à enquete' })
        return
      }

      if (err?.name === 'ALREADY_VOTED') {
        res.status(409).json({ message: 'Usuária já votou nesta enquete' })
        return
      }

      if (err?.name === 'SUPABASE_SERVICE_ROLE_KEY_INVALID') {
        res.status(500).json({ message: 'Configure SUPABASE_SERVICE_ROLE_KEY com uma chave service_role válida' })
        return
      }

      console.error('[enquetes][POST] Erro ao registrar voto', err)
      res.status(500).json({ message: 'Erro ao registrar voto' })
    }

    return
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS')
  res.status(405).json({ message: 'Método não permitido' })
}
