import { z } from 'zod'

export const LoginReqSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const LoginSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    accessTokenExpiredAt: z.string()
  })
})

export type LoginReqSchema = z.infer<typeof LoginReqSchema>
export type LoginSchema = z.infer<typeof LoginSchema>
