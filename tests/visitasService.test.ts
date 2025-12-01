import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/repositories/visitasRepository.js', () => ({
  salvarVisita: vi.fn()
}))

const repository = await import('../src/repositories/visitasRepository.js')
const { registrarVisita } = await import('../src/services/visitasService.js')

describe('registrarVisita (service)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('encaminha dados para o repositório e retorna mensagem amigável', async () => {
    const resultado = await registrarVisita('2024-05-01T12:00:00.000Z', 'Título de teste', 'novel-123', [' Drama ', 'drama', 'Romance'])

    expect(repository.salvarVisita).toHaveBeenCalledWith({
      data: '2024-05-01T12:00:00.000Z',
      title: 'Título de teste',
      novel: 'novel-123',
      tags: ['drama', 'romance']
    })
    expect(resultado.mensagem).toMatch(/visita registrada/i)
  })
})
