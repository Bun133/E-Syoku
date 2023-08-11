import {z} from "zod";
import {uniqueId} from "./types";
import {shopSchema} from "./shop";
import {paidDetailSchema} from "./payment";

export const prettyTicketStatusSchema = z.union([
    // PROCESSING
    z.literal("注文済み"),
    // COOKING
    z.literal("調理中"),
    // CALLED
    z.literal("受け取り待ち"),
    // RESOLVED
    z.literal("完了"),
    // INFORMED
    z.literal("お知らせ")
])

export type PrettyTicketStatus = z.infer<typeof prettyTicketStatusSchema>

export const prettyTimeStampSchema = z.object({
    utcSeconds: z.number(),
})

export type PrettyTimeStamp = z.infer<typeof prettyTimeStampSchema>

export const prettyGoodsSchema = z.object({
    goodsId: uniqueId,
    shop: shopSchema,
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
})

export type PrettyGoods = z.infer<typeof prettyGoodsSchema>

export const prettySingleOrderSchema = z.object({
    goods: prettyGoodsSchema,
    count: z.number()
})

export type PrettySingleOrder = z.infer<typeof prettySingleOrderSchema>

export const prettyOrderSchema = z.array(prettySingleOrderSchema)

export type PrettyOrder = z.infer<typeof prettyOrderSchema>
export const prettyTicketSchema = z.object({
    uniqueId: uniqueId,
    ticketNum: z.string(),
    shop: shopSchema,
    customerId: uniqueId,
    issueTime: prettyTimeStampSchema,
    orderData: prettyOrderSchema,
    paymentSessionId: uniqueId,
    status: prettyTicketStatusSchema
})

export type PrettyTicket = z.infer<typeof prettyTicketSchema>

export const prettyPaymentStateSchema = z.enum([
    "未支払い",
    "支払い済み"
])

export type PrettyPaymentState = z.infer<typeof prettyPaymentStateSchema>

export const prettyPaymentSessionSchema = z.object({
    sessionId: uniqueId,
    barcode: z.string(),
    customerId: uniqueId,
    orderContent: prettyOrderSchema,
    totalAmount: z.number(),
    state: prettyPaymentStateSchema,
    paidDetail: paidDetailSchema.optional(),
})

export type PrettyPaymentSession = z.infer<typeof prettyPaymentSessionSchema>