import { z } from 'zod'

const emailField = z.string().email({ message: 'e-mail estranho, confere aí' }).transform((value) => value.trim().toLowerCase())

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
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
  locale: localeSchema
})
