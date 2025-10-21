import type { VercelRequest, VercelResponse } from '@vercel/node'
import { comentarioCurtirSchema } from '../../../src/validation/comentarios.js'
import { curtirComentario } from '../../../src/services/comentariosService.js'
import { sendError, sendJson } from '../../../src/utils/http.js'

const extrairId = (query: VercelRequest['query']) => {
  const valor = query.id
  if (Array.isArray(valor)) {
    return valor[0]
  }
  return valor
}

const obterIp = (req: VercelRequest): string => {
  const header = (req.headers['x-real-ip'] ?? req.headers['x-forwarded-for']) as string | string[] | undefined
  if (Array.isArray(header)) {
    return header[0]
  }
  if (header != null) {
    return header.split(',')[0].trim()
  }

  const remoto = req.socket.remoteAddress
  if (remoto != null) {
    return remoto
  }

  return '0.0.0.0'
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, 'usa POST pra curtir, combinado?')
    return
  }

  const idRaw = extrairId(req.query)

  try {
    const { id } = comentarioCurtirSchema.parse({ id: idRaw })
    const ip = obterIp(req)
    try {
      const resposta = await curtirComentario(id, ip)
      sendJson(res, 200, resposta)
    } catch (error: any) {
      if (error?.name === 'CURTIDA_JA_REGISTRADA') {
        sendError(res, 429, 'calma aí, já contamos sua curtida')
        return
      }
      throw error
    }
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'id do comentário tá esquisito', error.issues)
      return
    }

    console.error('Erro ao curtir comentário', error)
    sendError(res, 500, 'não deu pra curtir agora, tenta depois')
  }
}
