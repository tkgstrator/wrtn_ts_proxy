import { ResultType } from '@/enums/result_type'
import { z } from 'zod'

export const ResultSchema = z.object({
  result: z.nativeEnum(ResultType)
})

export type ResultSchema = z.infer<typeof ResultSchema>
