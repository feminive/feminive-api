import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/repositories/leitoresRepository.js', () => ({
  listarProgresso: vi.fn(),
  obterLeitor: vi.fn(),
  registrarProgresso: vi.fn(),
  salvarLeitor: vi.fn(),
  listarTopPostsMaisLidos: vi.fn()
}))

const repository = await import('../src/repositories/leitoresRepository.js')
const { salvarProgressoLeitura } = await import('../src/services/leitoresService.js')

describe('salvarProgressoLeitura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bloqueia e-mails configurados para progresso', async () => {
    await expect(salvarProgressoLeitura('cefasheli@gmail.com', 'capitulo-1', 0.5, undefined, 'en'))
      .rejects.toMatchObject({ name: 'EMAIL_BLOQUEADO' })

    expect(repository.registrarProgresso).not.toHaveBeenCalled()
  })

  it('normaliza email antes de registrar progresso', async () => {
    await salvarProgressoLeitura('  Leitor@EMAIL.com ', 'capitulo-2', 0.25)

    expect(repository.registrarProgresso).toHaveBeenCalledWith('leitor@email.com', expect.objectContaining({
      slug: 'capitulo-2',
      progresso: 0.25,
      locale: 'br'
    }))
  })
})
