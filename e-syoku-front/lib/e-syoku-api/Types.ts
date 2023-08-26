import {z} from "zod"

export const uniqueId = z.string()

export const ticketStatus = z.enum(["PROCESSING", "CALLED", "INFORMED", "RESOLVED"])

export type TicketStatus = z.infer<typeof ticketStatus>

const timeStampSchema = z.object({
    _seconds: z.number(),
    _nanoseconds: z.number()
})

export const orderSchema = z.array(z.object({
    // 商品ID
    goodsId: uniqueId,
    // 注文数
    count: z.number(),
}))

export type Order = z.infer<typeof orderSchema>

export const ticketType = z.object({
    // 食券ID
    uniqueId: uniqueId,
    // 食券番号
    ticketNum: z.string(),
    // 店舗ID
    shopId: uniqueId,
    // 購入者UserId
    customerId: uniqueId,
    // 食券発行時刻
    issueTime: timeStampSchema,
    // 注文内容データ
    orderData: orderSchema,
    // 決済セッションID
    paymentSessionId: uniqueId,
    // 食券ステータスデータ
    status: ticketStatus
})

export type Ticket = z.infer<typeof ticketType>

export const shopDetailType = z.object({
    name: z.string(),
    shopId: z.string()
})

export type ShopDetail = z.infer<typeof shopDetailType>

///// 在庫データ /////

// ①在庫あり/なし
export const remainBooleanSchema = z.object({
    goodsId: uniqueId,
    // if the goods is still available or not.
    // if true, the goods is still available.
    // if false, the goods is not available.
    remain: z.boolean(),
})

// 在庫データ
// ②残り在庫〇個
export const remainNumberSchema = z.object({
    goodsId: uniqueId,
    // the amount of goods that is still available.
    remainCount: z.number(),
})

// 在庫データ
export type GoodsRemainData = z.infer<typeof goodsRemainDataSchema>

export const goodsRemainDataSchema = remainNumberSchema.or(remainBooleanSchema)

/////// Payment(決済セッションデータ) ////////

// 決済完了データ

export const paidDetailSchema = z.object({
    // 決済ID
    paymentId: uniqueId,
    // 決済取扱者ID
    paymentStaffId: uniqueId,
    // 購入者UserID
    customerId: uniqueId,
    // 決済完了時刻
    paidTime: timeStampSchema,
    // 決済完了金額
    paidAmount: z.number(),
    // 決済方法(現金,クレカ･･･)
    paidMeans: z.string(),
    // 備考
    remark: z.string().optional(),
})
export type PaidDetail = z.infer<typeof paidDetailSchema>

// 決済状況ステータス
export const paymentStateSchema = z.enum([
    // ①未支払い
    "UNPAID",
    // ②支払い済み(決済完了データが決済セッションデータに含まれる)
    "PAID"
])

export type PaymentState = z.infer<typeof paymentStateSchema>

// 決済セッションデータ
export const paymentSessionSchema = z.object({
    // 決済セッションID
    sessionId: uniqueId,
    barcode: z.string(),
    // 購入者UserID
    customerId: uniqueId,
    // 注文内容
    orderContent: orderSchema,
    // 合計金額
    totalAmount: z.number(),
    // 決済状況ステータス
    state: paymentStateSchema,
    // 決済完了データ
    paidDetail: paidDetailSchema.optional(),
})

export type PaymentSession = z.infer<typeof paymentSessionSchema>

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
    shop: shopDetailType,
    name: z.string(),
    price: z.number(),
    description: z.string().optional(),
    imageRefPath: z.string().optional(),
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
    shop: shopDetailType,
    customerId: uniqueId,
    issueTime: prettyTimeStampSchema,
    orderData: prettyOrderSchema,
    paymentSessionId: uniqueId,
    status: prettyTicketStatusSchema,
    lastStatusUpdated: prettyTimeStampSchema,
})

export type PrettyTicket = z.infer<typeof prettyTicketSchema>

export const prettyPaymentStateSchema = z.enum([
    "未支払い",
    "支払い済み"
])

export type PrettyPaymentState = z.infer<typeof prettyPaymentStateSchema>

export const prettyPaymentSessionSchema = z.object({
    sessionId: uniqueId,
    customerId: uniqueId,
    orderContent: prettyOrderSchema,
    totalAmount: z.number(),
    state: prettyPaymentStateSchema,
    paidDetail: paidDetailSchema.optional(),
    // 決済完了後に発行される食券のIDたち
    boundTicketId: uniqueId.array().optional(),
    barcode: z.string()
})

export type PrettyPaymentSession = z.infer<typeof prettyPaymentSessionSchema>


export const successSchema = z.object({
    isSuccess: z.literal(true),
    success: z.string().optional()
}).passthrough()

export const errorSchema = z.object({
    isSuccess: z.literal(false),
    error: z.string(),
    errorCode: z.string(),
    stack: z.string().optional()
})

export const errorResultSchema = z.object({
    isSuccess: z.literal(false),
    error: errorSchema,
    errors: errorSchema.array()
})

export const resultSchema = successSchema.or(errorResultSchema)

export const defaultResponseFormat = resultSchema

export type DefaultResponseFormat = z.infer<typeof defaultResponseFormat>

export const ticketResponse = defaultResponseFormat.and(z.object({
    ticket: prettyTicketSchema
}))

export type TicketStatusResponse = z.infer<typeof ticketResponse>

export const listTicketResponse = defaultResponseFormat.and(z.object({
    tickets: z.array(prettyTicketSchema)
}))

export const listShopResponse = defaultResponseFormat.and(z.object({
    shops: z.array(shopDetailType)
}))

export const registerTicketResponse = defaultResponseFormat.and(z.object({
    ticket: ticketType.optional()
}))

/// Request

export const ticketIdRequest = z.object({
    ticketId: uniqueId,
})
export const ticketSpecifyRequest = z.object({
    barcode: z.string()
}).or(ticketIdRequest)

export const waitingDataSchema = z.object({waiting: z.number()})

export type WaitingData = z.infer<typeof waitingDataSchema>

export const goodsWithRemainDataWaitingDataSchema = z.object({
    goods: prettyGoodsSchema,
    remainData: goodsRemainDataSchema,
    waitingData: waitingDataSchema
})


export type GoodsWithRemainDataWaitingData = z.infer<typeof goodsWithRemainDataWaitingDataSchema>

export const listGoodsResponse = defaultResponseFormat.and(z.object({
    data: z.array(goodsWithRemainDataWaitingDataSchema)
}))

export const submitOrderResponse = defaultResponseFormat.and(z.object({
    paymentSessionId: z.string()
}))

export const listPaymentResponse = defaultResponseFormat.and(z.object({
    payments: z.array(paymentSessionSchema)
}))

export const paymentStatusResponse = defaultResponseFormat.and(z.object({
    payment: prettyPaymentSessionSchema
}))

export const paymentIdRequest = z.object({
    paymentId: uniqueId.optional(),
    barcode: z.string().optional()
})

export type PaymentIdRequest = z.infer<typeof paymentIdRequest>

export const markPaymentPaidRequest = z.object({
    paymentId: uniqueId.optional(),
    paymentBarcode: z.string().optional(),
    paidAmount: z.number(),
    paidMeans: z.string(),
    remark: z.string().optional()
})

export const ticketDisplayData = z.object({
    ticketNum: z.string(),
    status: ticketStatus,
    ticketId: uniqueId,
    lastUpdated: timeStampSchema,
})

export type TicketDisplayData = z.infer<typeof ticketDisplayData>
export const ticketDisplayResponse = defaultResponseFormat.and(z.object({
    tickets: z.array(prettyTicketSchema)
}))

export const authType = z.enum(["ADMIN", "SHOP", "ANONYMOUS", "CASHIER"])

export type AuthType = z.infer<typeof authType>

export const authStateResponse = defaultResponseFormat.and(z.object({
    authType: authType.optional()
}))

export const grantPermissionRequest = z.object({
    authType: z.enum(["ADMIN", "ANONYMOUS"]),
    uid: uniqueId,
}).or(z.object({
    authType: z.enum(["SHOP"]),
    shopId: uniqueId,
    uid: uniqueId,
}))

export const paidResponse = defaultResponseFormat.and(z.object({
    ticketsId: z.string().array()
}))

export const bindTicketResponse = defaultResponseFormat.and(z.object({
    boundTicketId: uniqueId
}))