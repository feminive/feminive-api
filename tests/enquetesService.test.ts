import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { overridePollOptions } from '../src/lib/pollOptions.js'

vi.mock('../src/repositories/enquetesRepository.js', () => ({
  buscarVotoPorEnqueteEEmail: vi.fn(),
  salvarVotoEnquete: vi.fn()
}))

const repository = await import('../src/repositories/enquetesRepository.js')
const { verificarVoto, registrarVoto } = await import('../src/services/enquetesService.js')

describe('enquetesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    overridePollOptions({
      'enquete-1': ['opcao-1', 'opcao-2']
    })
  })

  afterEach(() => {
    overridePollOptions(null)
  })

  it('verificarVoto normaliza e consulta voto existente', async () => {
    (repository.buscarVotoPorEnqueteEEmail as any).mockResolvedValueOnce(null)

    const resultado = await verificarVoto('enquete-1', ' PARTICIPANTE@EMAIL.COM ')

    expect(resultado).toEqual({ hasVoted: false })
    expect(repository.buscarVotoPorEnqueteEEmail).toHaveBeenCalledWith('enquete-1', 'participante@email.com')
  })

  it('verificarVoto falha quando enquete não existe', async () => {
    overridePollOptions({})

    await expect(verificarVoto('enquete-x', 'participante@email.com'))
      .rejects.toMatchObject({ name: 'POLL_NOT_FOUND' })
  })

  it('registrarVoto valida opções da enquete', async () => {
    await expect(registrarVoto('enquete-1', 'opcao-invalida', 'participante@email.com'))
      .rejects.toMatchObject({ name: 'OPTION_NOT_ALLOWED' })
  })

  it('registrarVoto traduz erro de voto duplicado', async () => {
    (repository.salvarVotoEnquete as any).mockRejectedValueOnce(Object.assign(new Error('ALREADY_VOTED'), { name: 'ALREADY_VOTED' }))

    await expect(registrarVoto('enquete-1', 'opcao-1', 'participante@email.com'))
      .rejects.toMatchObject({ name: 'ALREADY_VOTED' })
  })

  it('registrarVoto normaliza email antes de salvar', async () => {
    (repository.salvarVotoEnquete as any).mockResolvedValueOnce({
      id: '1',
      poll_id: 'enquete-1',
      option_id: 'opcao-1',
      email: 'participante@email.com',
      locale: 'br',
      voted_at: new Date().toISOString()
    })

    const resultado = await registrarVoto('enquete-1', 'opcao-1', ' PARTICIPANTE@EMAIL.COM ')

    expect(resultado).toEqual({ success: true })
    expect(repository.salvarVotoEnquete).toHaveBeenCalledWith('enquete-1', 'opcao-1', 'participante@email.com', 'br')
  })
})
