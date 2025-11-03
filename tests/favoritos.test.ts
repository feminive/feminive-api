import { beforeEach, describe, expect, it, vi } from 'vitest'
import handlerFavoritos from '../api/favoritos/index.ts'
import handlerFavoritoDelete from '../api/favoritos/[slug].ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/favoritosService.js', () => ({
  obterFavoritos: vi.fn().mockResolvedValue({ data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } }),
  criarFavorito: vi.fn().mockResolvedValue({ post_slug: 'teste', created_at: '2024-01-01T00:00:00Z' }),
  excluirFavorito: vi.fn().mockResolvedValue(undefined)
}))

const services = await import('../src/services/favoritosService.js')

describe('rotas de favoritos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/favoritos exige user_id e responde 200 quando válido', async () => {
    const req: any = { method: 'GET', query: { user_id: 'user-123' } }
    const res = createMockResponse()

    await handlerFavoritos(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(services.obterFavoritos).toHaveBeenCalledWith('user-123', 20, 0)
  })

  it('GET /api/favoritos retorna 400 sem user_id', async () => {
    const req: any = { method: 'GET', query: {} }
    const res = createMockResponse()

    await handlerFavoritos(req, res as any)

    expect(res.statusCode).toBe(400)
  })

  it('POST /api/favoritos cria favorito', async () => {
    const req: any = { method: 'POST', body: { user_id: 'user-123', post_slug: 'teste' } }
    const res = createMockResponse()

    await handlerFavoritos(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(services.criarFavorito).toHaveBeenCalledWith('user-123', 'teste')
  })

  it('POST /api/favoritos retorna 409 em duplicado', async () => {
    (services.criarFavorito as any).mockRejectedValueOnce(Object.assign(new Error('FAVORITO_DUPLICADO'), { name: 'FAVORITO_DUPLICADO' }))

    const req: any = { method: 'POST', body: { user_id: 'user-123', post_slug: 'teste' } }
    const res = createMockResponse()

    await handlerFavoritos(req, res as any)

    expect(res.statusCode).toBe(409)
    expect(res.body.mensagem).toMatch(/favorito já existe/)
  })

  it('DELETE /api/favoritos/:slug remove favorito', async () => {
    const req: any = { method: 'DELETE', query: { slug: 'teste', user_id: 'user-123' } }
    const res = createMockResponse()

    await handlerFavoritoDelete(req, res as any)

    expect(res.statusCode).toBe(204)
    expect(services.excluirFavorito).toHaveBeenCalledWith('user-123', 'teste')
  })

  it('DELETE /api/favoritos/:slug responde 404 quando não existe', async () => {
    (services.excluirFavorito as any).mockRejectedValueOnce(Object.assign(new Error('FAVORITO_NAO_ENCONTRADO'), { name: 'FAVORITO_NAO_ENCONTRADO' }))

    const req: any = { method: 'DELETE', query: { slug: 'teste', user_id: 'user-123' } }
    const res = createMockResponse()

    await handlerFavoritoDelete(req, res as any)

    expect(res.statusCode).toBe(404)
  })
})
