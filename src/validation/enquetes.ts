import { z } from 'zod'

const pollIdSchema = z.string({ required_error: 'pollId é obrigatório' })
  .min(1, 'pollId é obrigatório')
  .transform((value) => value.trim())

const optionIdSchema = z.string({ required_error: 'optionId é obrigatório' })
  .min(1, 'optionId é obrigatório')
  .transform((value) => value.trim())

const emailSchema = z.string({ required_error: 'email é obrigatório' })
  .trim()
  .min(1, 'email é obrigatório')
  .email('email inválido')
  .transform((value) => value.toLowerCase())

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
  })

export const enqueteConsultaSchema = z.object({
  pollId: pollIdSchema,
  email: emailSchema
})

export const enqueteVotoSchema = z.object({
  pollId: pollIdSchema,
  optionId: optionIdSchema,
  email: emailSchema,
  locale: localeSchema
})
