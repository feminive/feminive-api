import { z } from 'zod'

const dataSchema = z.string({ required_error: 'data é obrigatória' })
  .trim()
  .min(1, 'data é obrigatória')
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'data inválida' })
  .transform((value) => new Date(value).toISOString())

const titleSchema = z.string({ required_error: 'title é obrigatório' })
  .trim()
  .min(1, 'title é obrigatório')
  .max(300, 'title deve ter no máximo 300 caracteres')

const novelSchema = z.string({ required_error: 'novel é obrigatório' })
  .trim()
  .min(1, 'novel é obrigatório')
  .max(200, 'novel deve ter no máximo 200 caracteres')

const tagsSchema = z.array(
  z.string()
    .trim()
    .min(1, 'tag inválida')
    .max(60, 'tag deve ter no máximo 60 caracteres')
).optional().default([])

export const visitaRegistroSchema = z.object({
  data: dataSchema,
  title: titleSchema,
  novel: novelSchema,
  tags: tagsSchema
})
