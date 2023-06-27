import {z} from "zod";
import {UserRecord} from "firebase-admin/auth";
import {timeStampSchema} from "./typeConv";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>


/////// Shop,Tickets ///////

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


/////// Auth ////////


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


/////// Goods ////////

export const goodsSchema = z.object({
    name: z.string(),
    goodsId: uniqueId,
    // the id of a shop that this goods belongs to.
    shopId: uniqueId,
    // YEN
    price: z.number(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
})

export type Goods = z.infer<typeof goodsSchema>

export const remainNumberSchema = z.object({
    goodsId: uniqueId,
    // the amount of goods that is still available.
    remainCount: z.number(),
})

export const remainBooleanSchema = z.object({
    goodsId: uniqueId,
    // if the goods is still available or not.
    // if true, the goods is still available.
    // if false, the goods is not available.
    remain: z.boolean(),
})

export const goodsRemainDataSchema = remainNumberSchema.or(remainBooleanSchema)

export type GoodsRemainData = z.infer<typeof goodsRemainDataSchema>


/////// Order ////////

/**
 * This type express an order.
 * It is not ensured that the order is valid or paid.
 */
export const orderSchema = z.object({
    items: z.array(goodsSchema)
})

/////// Payment ////////

export const paidDetailSchema = z.object({
    // Customer Account ID
    customerId: uniqueId,
    // the amount of money that the customer has paid.
    paidAmount: z.number(),
    // the time that the customer paid.
    paidTime: timeStampSchema,
    // the means of payment that the customer used.
    // Maybe contain the name of user who processed this payment
    paidMeans: z.string(),
})
export const paymentStateSchema = z.union([
    z.object({
        isPaid: z.literal("PAID"),
        paidDetail: paidDetailSchema
    })
    , z.object({
        isPaid: z.literal("UNPAID"),
    })])

export type PaymentState = z.infer<typeof paymentStateSchema>

export const paymentSchema = z.object({
    // the order which this payment organized with.
    targetOrder: orderSchema,
    // the amount of money that the customer must pay.
    total: z.number(),
    state: paymentStateSchema
})