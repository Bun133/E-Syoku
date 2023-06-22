import {z} from "zod"

export const uniqueIdSchema = z.string()

export const ticketStatus = z.enum(["PROCESSING", "CALLED", "INFORMED", "RESOLVED"])

export const ticketType = z.object({
    uniqueId: uniqueIdSchema,
    shopId: z.string(),
    ticketNum: z.string(),
    status: ticketStatus,
    description: z.string().optional(),
})

export type Ticket = z.infer<typeof ticketType>

export const shopDetailType = z.object({
    name: z.string(),
    shopId: z.string()
})

export type ShopDetail = z.infer<typeof shopDetailType>

export const defaultResponseFormat = z.object({
    isSuccess: z.boolean(),
    success: z.string().optional(),
    error: z.string().optional(),
})

export type DefaultResponseFormat = z.infer<typeof defaultResponseFormat>

export const ticketStatusResponse = defaultResponseFormat.and(z.object({
    ticket: ticketType.optional()
}))

export type TicketStatusResponse = z.infer<typeof ticketStatusResponse>

export const listTicketResponse = defaultResponseFormat.and(z.object({
    tickets: z.array(ticketType)
}))

export const listShopResponse = defaultResponseFormat.and(z.object({
    shops: z.array(shopDetailType)
}))


export const callTicketResponse = defaultResponseFormat.and(z.object({}))

export const cancelCallingResponse = defaultResponseFormat.and(z.object({}))

export const resolveTicketResponse = defaultResponseFormat.and(z.object({}))


export const registerTicketResponse = defaultResponseFormat.and(z.object({
    ticket: ticketType.optional()
}))

/// Request

export const ticketIdRequest = z.object({
    ticketId: uniqueIdSchema
})

export const registerTicketRequest = z.object({
    shopId: z.string(),
    ticketNum: z.string(),
    description: z.string().optional(),
})