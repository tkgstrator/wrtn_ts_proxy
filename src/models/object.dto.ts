import { ResultType } from '@/enums/result_type'
import { z } from 'zod'

export const ObjectSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    result: z.nativeEnum(ResultType),
    data: schema
  })

export type ObjectSchema<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof ObjectSchema<T>>>
