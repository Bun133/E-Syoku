import {z} from 'zod'


export const successSchema = z.object({
    isSuccess: z.literal(true),
    success: z.string().optional()
}).passthrough()

export const errorSchema = z.object({
    isSuccess: z.literal(false),
    error: z.string(),
    errorCode: z.string()
})

export const resultSchema = successSchema.or(errorSchema)

export type Result = z.infer<typeof resultSchema>
export type Success = z.infer<typeof successSchema>
export type Error = z.infer<typeof errorSchema>