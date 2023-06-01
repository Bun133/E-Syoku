import {z} from "zod";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

/**
 * Shop schema, expressing shop entry.
 */
export const shopSchema = z.object({
    name: z.string(),
    shopId: uniqueId,
});

export type Shop = z.infer<typeof shopSchema>

export const ticketStatusSchema = z.union([
    // Registered ticket but the item is not prepared yet.
    z.literal("PROCESSING"),
    // Registered ticket and the item is ready, the customer is called!
    z.literal("CALLED"),
    // Registered ticket but there is something wrong,And the shop needs customer to come to the shop.
    z.literal("INFORMED"),
    // Registered ticket and customer has picked up the item.
    z.literal("RESOLVED"),
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>

export const ticketSchema = z.object({
    uniqueId: uniqueId,
    shopId: uniqueId,
    ticketNum: z.string(),
    status: ticketStatusSchema,
    description: z.string().optional(),
});

export type Ticket = z.infer<typeof ticketSchema>
