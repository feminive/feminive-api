import { z } from 'zod'

export const comentarioListarSchema = z.object({
  slug: z.string().min(1, 'slug inválido').transform((value) => value.trim().toLowerCase())
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
    .transform((value) => value.trim())
})

export const comentarioCurtirSchema = z.object({
  id: z.string().uuid({ message: 'id de comentário esquisito' })
})
