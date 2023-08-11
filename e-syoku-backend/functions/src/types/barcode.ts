import {z} from 'zod';
import {uniqueId} from "./types";

export const ticketBarcodeBindDataSchema = z.object({
    barcode: z.string(),
    uid: uniqueId,
    ticketId: uniqueId
})

export type TicketBarcodeBindData = z.infer<typeof ticketBarcodeBindDataSchema>

