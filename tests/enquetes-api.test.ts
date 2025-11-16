import { describe, expect, it, vi, beforeEach } from 'vitest'
import handler from '../api/enquetes/index.ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/enquetesService.js', () => ({
  verificarVoto: vi.fn().mockResolvedValue({ hasVoted: false }),
  registrarVoto: vi.fn().mockResolvedValue({ success: true })
}))

const services = await import('../src/services/enquetesService.js')

describe('api/enquetes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/enquetes responde status do voto', async () => {
    const req: any = {
      method: 'GET',
      query: { pollId: 'enquete-1', email: 'Participante@Email.Com ' },
      headers: {}
    }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ hasVoted: false })
    expect(services.verificarVoto).toHaveBeenCalledWith('enquete-1', 'participante@email.com')
  })

  it('POST /api/enquetes registra voto', async () => {
    const req: any = {
      method: 'POST',
      body: { pollId: 'enquete-1', optionId: 'opcao-1', email: ' PARTICIPANTE@EMAIL.COM ', locale: 'EN' },
      headers: {}
    }
    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ success: true })
    expect(services.registrarVoto).toHaveBeenCalledWith('enquete-1', 'opcao-1', 'participante@email.com', 'en')
  })

  it('POST /api/enquetes retorna 409 para votos duplicados', async () => {
    (services.registrarVoto as any).mockRejectedValueOnce(Object.assign(new Error('Usuária já votou nesta enquete'), { name: 'ALREADY_VOTED' }))

    const req: any = {
      method: 'POST',
      body: { pollId: 'enquete-1', optionId: 'opcao-1', email: 'participante@email.com' },
      headers: {}
    }

    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ message: 'Usuária já votou nesta enquete' })
  })

  it('GET /api/enquetes valida parâmetros obrigatórios', async () => {
    const req: any = {
      method: 'GET',
      query: { pollId: '', email: 'email-inválido' },
      headers: {}
    }

    const res = createMockResponse()

    await handler(req, res as any)

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBeDefined()
  })
})
