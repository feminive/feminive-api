import { z } from 'zod'

export const TOP_POSTS_DEFAULT_LIMIT = 10
export const TOP_POSTS_MAX_LIMIT = 50

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
  })

export const topPostsQuerySchema = z.object({
  limit: z.coerce.number()
    .int()
    .min(1, 'limite precisa ser maior que zero')
    .max(TOP_POSTS_MAX_LIMIT, `limite máximo é ${TOP_POSTS_MAX_LIMIT}`)
    .optional(),
  locale: localeSchema
})
