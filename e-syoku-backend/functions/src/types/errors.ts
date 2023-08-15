import {z} from 'zod'


export const successResultSchema = z.object({
    isSuccess: z.literal(true),
    success: z.string().optional()
}).passthrough()

export const errorSchema = z.object({
    isSuccess: z.literal(false),
    error: z.string(),
    errorCode: z.string()
}).passthrough()

export const errorResultSchema = z.object({
    isSuccess: z.literal(false),
    error: errorSchema,
    // maybe empty
    errors: z.array(errorSchema)
})


export type Success = z.infer<typeof successResultSchema>
export type TypedSuccess<D> = Success & {
    data: D
}

export type SingleError = z.infer<typeof errorSchema>

export type Error = z.infer<typeof errorResultSchema>

export type Result = Success | Error
export type TypedResult<D> = TypedSuccess<D> | Error
export type SingleResult = Success | SingleError
export type TypedSingleResult<D> = TypedSuccess<D> | SingleError