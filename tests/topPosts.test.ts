import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/posts/mais-lidos.ts'
import { createMockResponse } from './helpers.js'
import { TOP_POSTS_DEFAULT_LIMIT } from '../src/validation/posts.js'

vi.mock('../src/services/leitoresService.js', () => ({
  obterTopPostsMaisLidos: vi.fn().mockResolvedValue([
    { slug: 'capitulo-1', totalConcluidos: 4 }
  ])
}))

const services = await import('../src/services/leitoresService.js')

describe('GET /api/posts/mais-lidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna ranking com limite padrão', async () => {
    const req: any = { method: 'GET', query: {} }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.topPosts).toHaveLength(1)
    expect(services.obterTopPostsMaisLidos).toHaveBeenCalledWith(TOP_POSTS_DEFAULT_LIMIT)
  })

  it('respeita o limite informado na query', async () => {
    const req: any = { method: 'GET', query: { limit: '5' } }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(services.obterTopPostsMaisLidos).toHaveBeenCalledWith(5)
  })

  it('retorna 400 para limite inválido', async () => {
    const req: any = { method: 'GET', query: { limit: '999' } }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(400)
    expect(res.body.mensagem).toMatch(/limite máximo/)
    expect(services.obterTopPostsMaisLidos).not.toHaveBeenCalled()
  })
})
