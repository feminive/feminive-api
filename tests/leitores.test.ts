import { describe, expect, it, vi, beforeEach } from 'vitest'
import handlerLeitor from '../api/leitores/[email].ts'
import handlerProgresso from '../api/leitores/[email]/progresso.ts'
import handlerLeitoresLista from '../api/leitores/index.ts'
import { createMockResponse } from './helpers.js'

vi.mock('../src/services/leitoresService.js', () => ({
  buscarLeitor: vi.fn().mockResolvedValue({ email: 'teste@exemplo.com', apelido: 'fã', atualizado_em: '2024-01-01T00:00:00.000Z' }),
  salvarApelidoLeitor: vi.fn().mockResolvedValue({ mensagem: 'apelido salvo bonitinho', leitor: { email: 'teste@exemplo.com', apelido: 'novo', atualizado_em: '2024-01-02T00:00:00.000Z' } }),
  salvarProgressoLeitura: vi.fn().mockResolvedValue({ mensagem: 'progresso anotado, continua firme!', atualizadoEm: '2024-01-02T00:00:00.000Z' }),
  listarProgressoLeitura: vi.fn().mockResolvedValue({
    concluidos: ['capitulo-1'],
    progresso: { 'capitulo-1': { progresso: 1, concluido: true, atualizadoEm: '2024-01-02T00:00:00.000Z', tags: ['drama'] } },
    contosLidos: 1,
    tagsMaisLidas: [{ tag: 'drama', count: 1 }]
  }),
  listarLeitoresComTags: vi.fn().mockResolvedValue({
    mensagem: 'leitores com tags listados',
    leitores: [{
      email: 'teste@exemplo.com',
      apelido: 'fã',
      tags: [{ tag: 'drama', count: 2 }, { tag: 'romance', count: 1 }]
    }],
    total: 1
  })
}))

const services = await import('../src/services/leitoresService.js')

describe('rotas de leitores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /leitores/:email retorna leitor', async () => {
    const req: any = { method: 'GET', query: { email: 'teste@exemplo.com' } }
    const res = createMockResponse()

    await handlerLeitor(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.leitor.email).toBe('teste@exemplo.com')
    expect(services.buscarLeitor).toHaveBeenCalledWith('teste@exemplo.com')
  })

  it('GET /leitores/:email retorna 404 quando não acha', async () => {
    (services.buscarLeitor as any).mockRejectedValueOnce(Object.assign(new Error('LEITOR_NAO_ENCONTRADO'), { name: 'LEITOR_NAO_ENCONTRADO' }))

    const req: any = { method: 'GET', query: { email: 'nao@tem.com' } }
    const res = createMockResponse()

    await handlerLeitor(req, res as any)

    expect(res.statusCode).toBe(404)
    expect(res.body.mensagem).toMatch(/não achei/)
  })

  it('PUT /leitores/:email salva apelido', async () => {
    const req: any = { method: 'PUT', query: { email: 'teste@exemplo.com' }, body: { apelido: 'Novo', locale: 'EN' } }
    const res = createMockResponse()

    await handlerLeitor(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.mensagem).toMatch(/apelido salvo/)
    expect(services.salvarApelidoLeitor).toHaveBeenCalledWith('teste@exemplo.com', 'Novo', 'en')
  })

  it('POST /leitores/:email/progresso valida dados', async () => {
    const req: any = { method: 'POST', query: { email: 'teste@exemplo.com', locale: 'en' }, body: { slug: 'Capitulo 1', progresso: 0.5, locale: 'EN' } }
    const res = createMockResponse()

    await handlerProgresso(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body.mensagem).toMatch(/progresso anotado/)
    expect(services.salvarProgressoLeitura).toHaveBeenCalledWith('teste@exemplo.com', 'capitulo-1', 0.5, undefined, 'en', undefined)
  })

  it('POST /leitores/:email/progresso ignora e-mail proibido mas responde sucesso', async () => {
    (services.salvarProgressoLeitura as any).mockResolvedValueOnce({ mensagem: 'progresso anotado, continua firme!', atualizadoEm: '2024-01-02T00:00:00.000Z' })

    const req: any = { method: 'POST', query: { email: 'cefasheli@gmail.com', locale: 'br' }, body: { slug: 'capitulo-1', progresso: 0.5, locale: 'br' } }
    const res = createMockResponse()

    await handlerProgresso(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body.mensagem).toMatch(/progresso anotado/)
    expect(services.salvarProgressoLeitura).toHaveBeenCalledWith('cefasheli@gmail.com', 'capitulo-1', 0.5, undefined, 'br', undefined)
  })

  it('GET /leitores/:email/progresso retorna mapa', async () => {
    const req: any = { method: 'GET', query: { email: 'teste@exemplo.com', locale: 'EN' } }
    const res = createMockResponse()

    await handlerProgresso(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.progresso['capitulo-1'].concluido).toBe(true)
    expect(res.body.contosLidos).toBe(1)
    expect(res.body.tagsMaisLidas).toEqual([{ tag: 'drama', count: 1 }])
    expect(services.listarProgressoLeitura).toHaveBeenCalledWith('teste@exemplo.com', 'en')
  })

  it('POST /leitores/:email/progresso aceita tags e repassa ao serviço', async () => {
    const req: any = { method: 'POST', query: { email: 'teste@exemplo.com', locale: 'br' }, body: { slug: 'capitulo-2', progresso: 0.3, locale: 'br', tags: ['Romance', ' Drama '] } }
    const res = createMockResponse()

    await handlerProgresso(req, res as any)

    expect(res.statusCode).toBe(201)
    expect(res.body.tags).toEqual(['romance', 'drama'])
    expect(services.salvarProgressoLeitura).toHaveBeenCalledWith('teste@exemplo.com', 'capitulo-2', 0.3, undefined, 'br', ['romance', 'drama'])
  })

  it('GET /leitores retorna leitores com tags paginado', async () => {
    const req: any = { method: 'GET', query: { limit: '10', offset: '5' } }
    const res = createMockResponse()

    await handlerLeitoresLista(req, res as any)

    expect(res.statusCode).toBe(200)
    expect(res.body.leitores[0].email).toBe('teste@exemplo.com')
    expect(res.body.leitores[0].tags).toEqual([{ tag: 'drama', count: 2 }, { tag: 'romance', count: 1 }])
    expect(services.listarLeitoresComTags).toHaveBeenCalledWith(10, 5)
  })
})
