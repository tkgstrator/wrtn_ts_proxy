import { z } from 'zod'
export const ErrorSchema = z.object({
  status: z.number().optional(),
  statusCode: z.number().optional(),
  message: z.string()
})

export type ErrorSchema = z.infer<typeof ErrorSchema>
