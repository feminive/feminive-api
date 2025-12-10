import { z } from 'zod'

const localeSchema = z.string()
  .optional()
  .default('br')
  .transform((value) => value.trim().toLowerCase())
  .refine((value): value is 'br' | 'en' => value === 'br' || value === 'en', {
    message: 'locale inválido'
  })

const anchorTypeSchema = z.string()
  .optional()
  .default('general')
  .transform((value) => value == null ? 'general' : value.trim().toLowerCase())
  .refine((value): value is 'general' | 'inline' => value === 'general' || value === 'inline', {
    message: 'anchor_type inválido'
  })

const anchorTypeFilterSchema = z.string()
  .optional()
  .transform((value) => value?.trim().toLowerCase())
  .refine((value): value is 'general' | 'inline' | undefined => value == null || value === 'general' || value === 'inline', {
    message: 'anchor_type inválido'
  })

const paragraphIdSchema = z.string()
  .trim()
  .min(1, 'paragraph_id inválido')
  .max(50, 'paragraph_id inválido')

export const comentarioLocaleSchema = localeSchema

export const comentarioListarSchema = z.object({
  slug: z.string().min(1, 'slug inválido').transform((value) => value.trim().toLowerCase()),
  anchor_type: anchorTypeFilterSchema,
  paragraph_id: paragraphIdSchema.optional(),
  locale: localeSchema
})

export const comentarioCriarSchema = z.object({
  autor: z.string({ required_error: 'me fala quem é você' })
    .min(2, 'autor muito curto')
    .max(80, 'nome gigante demais')
    .refine((value) => !/[<>]/.test(value), { message: 'sem HTML aqui' })
    .transform((value) => value.trim()),
  conteudo: z.string({ required_error: 'preciso do conteúdo' })
    .min(5, 'fala mais um pouquinho')
    .max(500, 'texto longo demais')
    .refine((value) => !/(https?:\/\/|www\.)/i.test(value), { message: 'sem links por enquanto, beleza?' })
    .transform((value) => value.trim()),
  anchor_type: anchorTypeSchema,
  paragraph_id: paragraphIdSchema.optional(),
  start_offset: z.number().int('precisa ser um número inteiro').min(0, 'start_offset inválido').optional(),
  end_offset: z.number().int('precisa ser um número inteiro').min(1, 'end_offset inválido').optional(),
  parent_id: z.string()
    .trim()
    .uuid({ message: 'parent_id inválido' })
    .optional(),
  quote: z.string()
    .trim()
    .max(300, 'quote muito longa')
    .optional()
    .transform((value) => value === '' ? undefined : value),
  locale: localeSchema
}).superRefine((value, ctx) => {
  const anchorType = value.anchor_type ?? 'general'

  if (anchorType === 'inline') {
    if (value.paragraph_id == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'paragraph_id obrigatório para comentários inline', path: ['paragraph_id'] })
    }

    if (value.start_offset == null || Number.isNaN(value.start_offset)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'start_offset obrigatório para comentários inline', path: ['start_offset'] })
    }

    if (value.end_offset == null || Number.isNaN(value.end_offset)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'end_offset obrigatório para comentários inline', path: ['end_offset'] })
    }

    if (value.start_offset != null && value.end_offset != null && value.end_offset <= value.start_offset) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'end_offset deve ser maior que start_offset', path: ['end_offset'] })
    }
  }
})

export const comentarioCurtirSchema = z.object({
  id: z.string().uuid({ message: 'id de comentário esquisito' })
})
