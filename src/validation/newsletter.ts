import { z } from 'zod'

export const newsletterInscreverSchema = z.object({
  email: z.string().email({ message: 'manda um e-mail válido aí' }).transform((value) => value.trim().toLowerCase()),
  origem: z.string().max(120, 'origem muito grandona').optional()
})

export const newsletterCancelarSchema = z.object({
  email: z.string().email({ message: 'preciso de um e-mail válido' }).transform((value) => value.trim().toLowerCase()),
  motivo: z.string().max(250, 'motivo gigante demais').optional()
})

export const newsletterStatusSchema = z.object({
  email: z.string().email({ message: 'passa um e-mail válido' }).transform((value) => value.trim().toLowerCase())
})
