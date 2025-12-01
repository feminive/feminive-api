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

const limitSchema = z.union([
  z.number(),
  z.string()
]).optional().transform((value) => {
  if (value === undefined || value === null || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 1) return undefined
  return Math.min(Math.floor(num), 500)
})

const offsetSchema = z.union([
  z.number(),
  z.string()
]).optional().transform((value) => {
  if (value === undefined || value === null || value === '') return 0
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return Math.floor(num)
})

export const visitaRegistroSchema = z.object({
  data: dataSchema,
  title: titleSchema,
  novel: novelSchema,
  tags: tagsSchema
})

export const visitaListQuerySchema = z.object({
  limit: limitSchema,
  offset: offsetSchema
})
