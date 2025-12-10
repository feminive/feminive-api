import { describe, expect, it, vi, beforeEach } from 'vitest'
import handlerComentarios from '../api/posts/comentarios.ts'
import handlerCurtir from '../api/comentarios/[id]/curtir.ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/comentariosService.js', () => ({
  obterComentarios: vi.fn().mockResolvedValue({ mensagem: 'comentários carregados', comentarios: [] }),
  criarNovoComentario: vi.fn().mockResolvedValue({
    mensagem: 'comentário enviado, valeu demais!',
    comentario: {
      id: '1',
      slug: 'teste',
      autor: 'eu',
      conteudo: 'legal',
      curtidas: 0,
      criado_em: '2024-01-01',
      anchor_type: 'general',
      paragraph_id: null,
      start_offset: null,
      end_offset: null,
      quote: null,
      parent_id: null
    }
  }),
  curtirComentario: vi.fn().mockResolvedValue({ mensagem: 'curtida registrada, obrigada!' })
}))

const services = await import('../src/services/comentariosService.js')

describe('rotas de comentários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /posts/:slug/comentarios responde 200', async () => {
    const req: any = { method: 'GET', query: { slug: 'teste', locale: 'EN' } }
    const res = createMockResponse()

    await handlerComentarios(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.mensagem).toMatch(/comentários carregados/)
    expect(services.obterComentarios).toHaveBeenCalledWith('teste', 'en', undefined)
  })

  it('GET /posts/:slug/comentarios aceita filtros de ancoragem', async () => {
    const req: any = { method: 'GET', query: { slug: 'teste', locale: 'EN', anchor_type: 'inline', paragraph_id: 'p2' } }
    const res = createMockResponse()

    await handlerComentarios(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(services.obterComentarios).toHaveBeenCalledWith('teste', 'en', { anchor_type: 'inline', paragraph_id: 'p2' })
  })

  it('POST /posts/:slug/comentarios valida corpo', async () => {
    const req: any = { method: 'POST', query: { slug: 'teste', locale: 'br' }, body: { autor: 'eu', conteudo: 'tudo bem com vc?', locale: 'EN' } }
    const res = createMockResponse()

    await handlerComentarios(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body.mensagem).toMatch(/comentário enviado/)
    expect(services.criarNovoComentario).toHaveBeenCalledWith('teste', 'eu', 'tudo bem com vc?', 'en', {
      anchor_type: 'general',
      paragraph_id: undefined,
      start_offset: undefined,
      end_offset: undefined,
      parent_id: undefined,
      quote: undefined
    })
  })

  it('POST /posts/:slug/comentarios aceita inline', async () => {
    const req: any = {
      method: 'POST',
      query: { slug: 'teste', locale: 'en' },
      body: {
        autor: 'eu',
        conteudo: 'tudo bem com vc?',
        anchor_type: 'inline',
        paragraph_id: 'p12',
        start_offset: 10,
        end_offset: 20,
        quote: 'recorte'
      }
    }
    const res = createMockResponse()

    await handlerComentarios(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(services.criarNovoComentario).toHaveBeenCalledWith('teste', 'eu', 'tudo bem com vc?', 'en', {
      anchor_type: 'inline',
      paragraph_id: 'p12',
      start_offset: 10,
      end_offset: 20,
      parent_id: undefined,
      quote: 'recorte'
    })
  })

  it('POST /comentarios/:id/curtir bloqueia repetição', async () => {
    (services.curtirComentario as any).mockRejectedValueOnce(Object.assign(new Error('CURTIDA_JA_REGISTRADA'), { name: 'CURTIDA_JA_REGISTRADA' }))

    const req: any = { method: 'POST', query: { id: '550e8400-e29b-41d4-a716-446655440000', locale: 'EN' }, headers: {}, socket: { remoteAddress: '1.1.1.1' } }
    const res = createMockResponse()

    await handlerCurtir(req, res as any)

    expect(res.statusCode).toBe(429)
    expect(res.body.mensagem).toMatch(/calma aí/)
    expect(services.curtirComentario).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      '1.1.1.1',
      'en'
    )
  })
})
