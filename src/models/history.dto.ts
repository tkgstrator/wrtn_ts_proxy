import { Model } from '@/enums/model'
import { z } from 'zod'

export const MessageSchema = z.object({
  _id: z.string(),
  chatId: z.string(),
  content: z.string()
})

export const HistorySchema = z.object({
  _id: z.string(),
  createdAt: z.string(),
  isDeleted: z.boolean(),
  messagedAt: z.string(),
  model: z.nativeEnum(Model),
  messages: z.array(z.union([MessageSchema, z.array(MessageSchema)])).optional(),
  shareChatIds: z.array(z.string()),
  topic: z.string().optional(),
  updatedAt: z.string(),
  userId: z.string(),
  version: z.string()
})

export type MessageSchema = z.infer<typeof MessageSchema>
export type HistorySchema = z.infer<typeof HistorySchema>
