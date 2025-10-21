import type { VercelRequest, VercelResponse } from '@vercel/node'
import { comentarioCriarSchema, comentarioListarSchema } from '../../../src/validation/comentarios.js'
import { criarNovoComentario, obterComentarios } from '../../../src/services/comentariosService.js'
import { sendError, sendJson } from '../../../src/utils/http.js'

const extrairSlug = (query: VercelRequest['query']) => {
  const valor = query.slug
  if (Array.isArray(valor)) {
    return valor[0]
  }
  return valor
}

export default async function handler (req: VercelRequest, res: VercelResponse): Promise<void> {
  const slugRaw = extrairSlug(req.query)

  try {
    const { slug } = comentarioListarSchema.parse({ slug: slugRaw })

    if (req.method === 'GET') {
      const resultado = await obterComentarios(slug)
      sendJson(res, 200, resultado)
      return
    }

    if (req.method === 'POST') {
      try {
        const corpo = comentarioCriarSchema.parse(req.body)
        const resultado = await criarNovoComentario(slug, corpo.autor, corpo.conteudo)
        sendJson(res, 201, resultado)
      } catch (error: any) {
        if (error?.issues != null) {
          sendError(res, 400, 'comentário inválido', error.issues)
          return
        }
        throw error
      }
      return
    }

    sendError(res, 405, 'esse método não tá liberado aqui')
  } catch (error: any) {
    if (error?.issues != null) {
      sendError(res, 400, 'slug estranho, confere', error.issues)
      return
    }

    console.error('Erro na rota de comentários', error)
    sendError(res, 500, 'o servidor tropeçou, foi mal')
  }
}
