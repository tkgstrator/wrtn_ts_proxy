import { Model } from '@/enums/model'
import { Platform } from '@/enums/platform'
import { z } from 'zod'

export const StartSchema = z.object({
  id: z.string(),
  model: z.nativeEnum(Model),
  email: z.string().email(),
  platform: z.nativeEnum(Platform)
})

export type StartSchema = z.infer<typeof StartSchema>
