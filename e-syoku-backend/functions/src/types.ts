import {z} from "zod";
import {UserRecord} from "firebase-admin/lib/auth";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>

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

const AdminAuth = z.literal("ADMIN")
const ShopAuth = z.literal("SHOP")
const AnonymousAuth = z.literal("ANONYMOUS")
const AuthType = z.union([AdminAuth, ShopAuth, AnonymousAuth])
export type AuthType = z.infer<typeof AuthType>

const AdminAuthEntry = z.object({
    authType: AdminAuth,
    uid: uniqueId
})

export type  AdminAuthEntry = z.infer<typeof AdminAuthEntry>

const ShopAuthEntry = z.object({
    authType: ShopAuth,
    uid: uniqueId,
    shopId: uniqueId
})

export type ShopAuthEntry = z.infer<typeof ShopAuthEntry>

const AnonymousAuthEntry = z.object({
    authType: AnonymousAuth,
    uid: uniqueId
})

export type AnonymousAuthEntry = z.infer<typeof AnonymousAuthEntry>

export const authEntrySchema = AdminAuthEntry.or(ShopAuthEntry).or(AnonymousAuthEntry)

/**
 * AuthEntry is the data stored in db.
 * Not use this to check user's permission.
 */
export type AuthEntry = z.infer<typeof authEntrySchema>;
export const authInstanceSchema = authEntrySchema.and(z.object({
    auth: z.instanceof(UserRecord)
}))

/**
 * AuthInstance is the data combined AuthEntry and UserRecord.
 * This instance can be used to check user's permission.
 */
export type AuthInstance = z.infer<typeof authInstanceSchema>