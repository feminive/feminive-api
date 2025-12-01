import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/visitas/index.ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/visitasService.js', () => ({
  registrarVisita: vi.fn().mockResolvedValue({ mensagem: 'visita registrada, obrigada!' })
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

  it('recusa métodos diferentes de POST', async () => {
    const req: any = { method: 'GET', body: {} }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(405)
    expect(res.body.mensagem).toMatch(/método não permitido/i)
  })
})
