import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/visitas/index.ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/visitasService.js', () => ({
  registrarVisita: vi.fn().mockResolvedValue({ mensagem: 'visita registrada, obrigada!' }),
  obterVisitas: vi.fn().mockResolvedValue({ mensagem: 'visitas carregadas', visitas: [], total: 0 })
}))

const services = await import('../src/services/visitasService.js')

describe('rota /visitas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST registra visita com dados válidos', async () => {
    const req: any = {
      method: 'POST',
      body: {
        data: '2024-05-01T00:00:00Z',
        title: 'Capítulo teste',
        novel: 'novel-xyz',
        tags: ['Tag1', 'tag1', 'tag2']
      }
    }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body.mensagem).toMatch(/visita registrada/i)
    expect(services.registrarVisita).toHaveBeenCalledWith(
      '2024-05-01T00:00:00.000Z',
      'Capítulo teste',
      'novel-xyz',
      ['Tag1', 'tag1', 'tag2']
    )
  })

  it('POST retorna 400 se faltar campo obrigatório', async () => {
    const req: any = { method: 'POST', body: { data: '', title: '', novel: 'novel-xyz' } }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(400)
    expect(res.body.mensagem).toMatch(/obrigatória|inválidos/i)
    expect(services.registrarVisita).not.toHaveBeenCalled()
  })

  it('GET lista visitas', async () => {
    const req: any = { method: 'GET', query: { limit: '5', offset: '10' } }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.mensagem).toMatch(/visitas carregadas/i)
    expect(res.body.total).toBeDefined()
    expect(services.obterVisitas).toHaveBeenCalledWith(5, 10)
  })

  it('GET com limit inválido ainda retorna padrão', async () => {
    const req: any = { method: 'GET', query: { limit: '-1' } }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(services.obterVisitas).toHaveBeenCalledWith(undefined, 0)
  })

  it('recusa métodos diferentes de GET/POST', async () => {
    const req: any = { method: 'PUT', body: {} }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(405)
    expect(res.body.mensagem).toMatch(/método não permitido/i)
  })
})
