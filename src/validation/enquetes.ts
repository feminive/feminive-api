import { z } from 'zod'

const pollIdSchema = z.string({ required_error: 'pollId é obrigatório' })
  .min(1, 'pollId é obrigatório')
  .transform((value) => value.trim())

const optionIdSchema = z.string({ required_error: 'optionId é obrigatório' })
  .min(1, 'optionId é obrigatório')
  .transform((value) => value.trim())

const emailSchema = z.string({ required_error: 'email é obrigatório' })
  .email('email inválido')
  .transform((value) => value.trim().toLowerCase())

export const enqueteConsultaSchema = z.object({
  pollId: pollIdSchema,
  email: emailSchema
})

export const enqueteVotoSchema = z.object({
  pollId: pollIdSchema,
  optionId: optionIdSchema,
  email: emailSchema
})
