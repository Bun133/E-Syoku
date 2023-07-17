import {z} from "zod";

export const ticketNumConfigSchema = z.object({
    ticketNumLeading: z.string()
})


export const ticketNumInfoSchema = z.object({
    lastTicketNum: z.string(),
    ticketNumConfig: ticketNumConfigSchema.optional()
})

export type TicketNumInfo = z.infer<typeof ticketNumInfoSchema>

