import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/repositories/visitasRepository.js', () => ({
  salvarVisita: vi.fn(),
  listarVisitas: vi.fn().mockResolvedValue({ visitas: [], total: 0 })
}))

const repository = await import('../src/repositories/visitasRepository.js')
const { registrarVisita, obterVisitas } = await import('../src/services/visitasService.js')

describe('registrarVisita (service)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('encaminha dados para o repositório e retorna mensagem amigável', async () => {
    const resultado = await registrarVisita('2024-05-01T12:00:00.000Z', 'Título de teste', 'novel-123', 'pt-BR', [' Drama ', 'drama', 'Romance'])

    expect(repository.salvarVisita).toHaveBeenCalledWith({
      data: '2024-05-01T12:00:00.000Z',
      title: 'Título de teste',
      novel: 'novel-123',
      locale: 'pt-BR',
      tags: ['drama', 'romance']
    })
    expect(resultado.mensagem).toMatch(/visita registrada/i)
  })

  it('lista visitas com limite e offset seguros', async () => {
    await obterVisitas(10, 5)

    expect(repository.listarVisitas).toHaveBeenCalledWith(10, 5)
  })
})
