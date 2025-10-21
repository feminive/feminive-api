import { describe, expect, it, vi, beforeEach } from 'vitest'
import handlerInscrever from '../api/newsletter/inscrever.js'
import handlerCancelar from '../api/newsletter/cancelar.js'
import handlerStatus from '../api/newsletter/status.js'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/newsletterService.js', () => ({
  inscreverNewsletter: vi.fn().mockResolvedValue({ mensagem: 'ok' }),
  cancelarNewsletter: vi.fn().mockResolvedValue({ mensagem: 'cancelado' }),
  statusNewsletter: vi.fn().mockResolvedValue({ inscrito: true, canceladoEm: null })
}))

const services = await import('../src/services/newsletterService.js')

describe('rotas de newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inscrever responde 201 com mensagem', async () => {
    const req: any = { method: 'POST', body: { email: 'teste@exemplo.com' } }
    const res = createMockResponse()

    await handlerInscrever(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ mensagem: 'ok' })
    expect(services.inscreverNewsletter).toHaveBeenCalledWith('teste@exemplo.com', undefined)
  })

  it('inscrever valida email e retorna 400', async () => {
    const req: any = { method: 'POST', body: { email: 'errado' } }
    const res = createMockResponse()

    await handlerInscrever(req, res as any)

    expect(res.statusCode).toBe(400)
    expect(res.body.mensagem).toMatch(/dados inválidos/)
  })

  it('cancelar sempre retorna 200', async () => {
    const req: any = { method: 'POST', body: { email: 'teste@exemplo.com' } }
    const res = createMockResponse()

    await handlerCancelar(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ mensagem: 'cancelado' })
    expect(services.cancelarNewsletter).toHaveBeenCalled()
  })

  it('status retorna dados da service', async () => {
    const req: any = { method: 'GET', query: { email: 'teste@exemplo.com' } }
    const res = createMockResponse()

    await handlerStatus(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.inscrito).toBe(true)
    expect(services.statusNewsletter).toHaveBeenCalledWith('teste@exemplo.com')
  })
})
