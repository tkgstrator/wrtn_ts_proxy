import { z } from 'zod'

export const PromptSchema = z.string().openapi({
  description: 'メッセージID',
  example: '66ce6811f02dfa2e14a19394'
})

export type PromptSchema = z.infer<typeof PromptSchema>
