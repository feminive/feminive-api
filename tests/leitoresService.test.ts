import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressoRegistro } from '../src/repositories/leitoresRepository.js'

vi.mock('../src/repositories/leitoresRepository.js', () => ({
  listarProgresso: vi.fn(),
  obterLeitor: vi.fn(),
  registrarProgresso: vi.fn(),
  salvarLeitor: vi.fn(),
  listarTopPostsMaisLidos: vi.fn()
}))

const repository = await import('../src/repositories/leitoresRepository.js')
const { salvarProgressoLeitura, listarProgressoLeitura } = await import('../src/services/leitoresService.js')

describe('salvarProgressoLeitura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignora silenciosamente e-mails configurados para progresso', async () => {
    const resultado = await salvarProgressoLeitura('cefasheli@gmail.com', 'capitulo-1', 0.5, undefined, 'en')

    expect(resultado.mensagem).toMatch(/progresso anotado/)
    expect(repository.registrarProgresso).not.toHaveBeenCalled()
  })

  it('normaliza email antes de registrar progresso', async () => {
    await salvarProgressoLeitura('  Leitor@EMAIL.com ', 'capitulo-2', 0.25)

    expect(repository.registrarProgresso).toHaveBeenCalledWith('leitor@email.com', expect.objectContaining({
      slug: 'capitulo-2',
      progresso: 0.25,
      locale: 'br',
      tags: []
    }))
  })

  it('normaliza e deduplica tags antes de registrar progresso', async () => {
    await salvarProgressoLeitura('alguem@email.com', 'capitulo-3', 0.75, false, 'br', [' Drama ', 'DRAMA', 'romance'])

    expect(repository.registrarProgresso).toHaveBeenCalledWith('alguem@email.com', expect.objectContaining({
      slug: 'capitulo-3',
      tags: ['drama', 'romance']
    }))
  })
})

describe('listarProgressoLeitura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna contos lidos e top tags apenas para concluídos', async () => {
    ;(repository.listarProgresso as any).mockResolvedValueOnce([
      { slug: 'conto-1', progresso: 1, concluido: true, atualizado_em: '2024-01-01', locale: 'br', tags: ['drama', 'terror'] } satisfies ProgressoRegistro,
      { slug: 'conto-2', progresso: 0.5, concluido: false, atualizado_em: '2024-01-02', locale: 'br', tags: ['drama'] } satisfies ProgressoRegistro,
      { slug: 'conto-3', progresso: 1, concluido: true, atualizado_em: '2024-01-03', locale: 'br', tags: ['drama', 'romance', 'drama'] } satisfies ProgressoRegistro
    ])

    const resultado = await listarProgressoLeitura('teste@exemplo.com', 'br')

    expect(resultado.contosLidos).toBe(2)
    expect(resultado.tagsMaisLidas).toEqual([{ tag: 'drama', count: 2 }, { tag: 'romance', count: 1 }, { tag: 'terror', count: 1 }])
    expect(Object.keys(resultado.progresso)).toHaveLength(3)
  })
})
