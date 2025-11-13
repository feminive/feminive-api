import { z } from 'zod'

export const TOP_POSTS_DEFAULT_LIMIT = 10
export const TOP_POSTS_MAX_LIMIT = 50

export const topPostsQuerySchema = z.object({
  limit: z.coerce.number()
    .int()
    .min(1, 'limite precisa ser maior que zero')
    .max(TOP_POSTS_MAX_LIMIT, `limite máximo é ${TOP_POSTS_MAX_LIMIT}`)
    .optional()
})
