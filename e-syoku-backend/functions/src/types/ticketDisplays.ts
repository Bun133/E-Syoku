import {z} from 'zod';
import {ticketStatusSchema} from "./ticket";
import {firestoreRefSchema, uniqueId} from "./types";

export const ticketDisplaySchema = z.object({
    ticketNum: z.string(),
    status: ticketStatusSchema,
    ticketDataRef: firestoreRefSchema,
    ticketId: uniqueId
})

export type TicketDisplayData = z.infer<typeof ticketDisplaySchema>