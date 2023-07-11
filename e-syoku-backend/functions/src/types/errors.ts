import {z} from 'zod'


export const successSchema = z.object({
    isSuccess: z.literal(true),
    success: z.string().optional()
}).passthrough()

export const singleErrorSchema = z.object({
    isSuccess: z.literal(false),
    error: z.string(),
    errorCode: z.string()
}).passthrough()

export const multipleErrorSchema = z.object({
    isSuccess: z.literal(false),
    errors: z.array(singleErrorSchema),
    // 複数のErrorをまとめて一つのErrorとして扱うとき用
    error: singleErrorSchema.optional()
}).passthrough()

export const errorSchema = singleErrorSchema.or(multipleErrorSchema)
export const resultSchema = successSchema.or(errorSchema)

export type Result = z.infer<typeof resultSchema>
export type Success = z.infer<typeof successSchema>
export type Error = z.infer<typeof errorSchema>
export type SingleError = z.infer<typeof singleErrorSchema>
export type MultipleError = z.infer<typeof multipleErrorSchema>