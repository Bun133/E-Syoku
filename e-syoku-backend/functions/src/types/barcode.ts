import {z} from 'zod';
import {uniqueId} from "./types";

export const barcodeBindDataSchema = z.object({
    barcode: z.number(),
    ticketId: uniqueId
})

export type BarcodeBindData = z.infer<typeof barcodeBindDataSchema>

