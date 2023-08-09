import {z} from 'zod';
import {ticketStatusSchema} from "./ticket";
import {firestoreRefSchema, timeStampSchema, uniqueId} from "./types";

export const ticketDisplaySchema = z.object({
    ticketNum: z.string(),
    status: ticketStatusSchema,
    ticketDataRef: firestoreRefSchema,
    ticketId: uniqueId,
    uid:uniqueId,
    lastUpdated: timeStampSchema
})

export type TicketDisplayData = z.infer<typeof ticketDisplaySchema>