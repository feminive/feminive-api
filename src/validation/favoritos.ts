import { z } from 'zod'

const slugTransform = (value: string): string => value.trim().toLowerCase()

const slugRegex = /^[a-z0-9-]+$/

export const favoritoUsuarioSchema = z.object({
  user_id: z.string({ required_error: 'user_id obrigatório' })
    .min(1, 'user_id obrigatório')
    .max(190, 'user_id muito longo')
    .transform((value) => value.trim())
})

export const favoritoBodySchema = z.object({
  post_slug: z.string({ required_error: 'post_slug obrigatório' })
    .min(1, 'post_slug obrigatório')
    .max(120, 'post_slug muito longo')
    .transform(slugTransform)
    .refine((value) => slugRegex.test(value), { message: 'post_slug com caracteres inválidos' })
})

export const favoritoCriarSchema = favoritoBodySchema.merge(favoritoUsuarioSchema)

export const favoritoSlugParamSchema = z.object({
  slug: z.string({ required_error: 'slug obrigatório' })
    .min(1, 'slug obrigatório')
    .max(120, 'slug muito longo')
    .transform(slugTransform)
    .refine((value) => slugRegex.test(value), { message: 'slug com caracteres inválidos' })
})

export const favoritosQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})

export const favoritosListarSchema = favoritosQuerySchema.merge(favoritoUsuarioSchema)
