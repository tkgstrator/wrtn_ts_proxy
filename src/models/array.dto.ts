import { ResultType } from '@/enums/result_type'
import { z } from 'zod'

export const ArraySchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    result: z.nativeEnum(ResultType),
    data: z.array(schema)
  })

export type ArraySchema<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof ArraySchema<T>>>
