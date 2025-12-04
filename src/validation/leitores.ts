import { z } from 'zod'

const emailField = z.string().email({ message: 'e-mail estranho, confere aí' }).transform((value) => value.trim().toLowerCase())

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
  })

const tagsSchema = z.array(
  z.string()
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => value.length > 0, { message: 'tag não pode ser vazia' })
)
  .max(20, 'manda no máximo 20 tags')
  .transform((tags) => Array.from(new Set(tags)))
  .optional()

const limitListSchema = z.union([z.number(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') return 50
    const num = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(num) || num < 1) return 50
    return Math.min(Math.floor(num), 200)
  })

const offsetListSchema = z.union([z.number(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') return 0
    const num = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(num) || num < 0) return 0
    return Math.floor(num)
  })

export const leitorLocaleSchema = localeSchema

export const leitorEmailParamSchema = z.object({
  email: emailField
})

export const leitorApelidoSchema = z.object({
  apelido: z.string({ required_error: 'manda um apelido' })
    .max(60, 'apelido precisa ter até 60 letras')
    .refine((value) => !/[<>]/.test(value), { message: 'sem HTML no apelido, por favor' })
    .transform((value) => value.trim()),
  locale: localeSchema
})

export const leitorProgressoBodySchema = z.object({
  slug: z.string({ required_error: 'passa o slug' })
    .min(1, 'slug vazio não rola')
    .transform((value) => value.trim().toLowerCase().replace(/\s+/g, '-')),
  progresso: z.number({ required_error: 'informa o progresso' })
    .min(0, 'progresso não pode ser negativo')
    .max(1, 'progresso não pode passar de 1'),
  concluido: z.boolean().optional(),
  locale: localeSchema,
  tags: tagsSchema
})

export const leitoresListQuerySchema = z.object({
  limit: limitListSchema,
  offset: offsetListSchema
})
