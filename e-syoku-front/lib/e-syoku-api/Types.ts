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

////// Goods(商品) //////

// 商品データ
export const goodsSchema = z.object({
    // 商品ID
    goodsId: uniqueId,
    // 販売店舗ID
    shopId: uniqueId,
    // 表示名
    name: z.string(),
    // 価格
    price: z.number(),
    // 商品説明文
    description: z.string().optional(),
    // 商品画像
    imageUrl: z.string().optional(),
})

export type Goods = z.infer<typeof goodsSchema>

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


export const successSchema = z.object({
    isSuccess: z.literal(true),
    success: z.string().optional()
}).passthrough()

export const errorSchema = z.object({
    isSuccess: z.literal(false),
    error: z.string(),
    errorCode: z.string()
})

export const resultSchema = successSchema.or(errorSchema)

export const defaultResponseFormat = resultSchema

export type DefaultResponseFormat = z.infer<typeof defaultResponseFormat>

export const ticketStatusResponse = defaultResponseFormat.and(z.object({
    ticket: ticketType.optional()
}))

export type TicketStatusResponse = z.infer<typeof ticketStatusResponse>

export const listTicketResponse = defaultResponseFormat.and(z.object({
    tickets: z.array(ticketType)
}))

export const listShopResponse = defaultResponseFormat.and(z.object({
    shops: z.array(shopDetailType)
}))


export const callTicketResponse = defaultResponseFormat.and(z.object({}))

export const cancelCallingResponse = defaultResponseFormat.and(z.object({}))

export const resolveTicketResponse = defaultResponseFormat.and(z.object({}))


export const registerTicketResponse = defaultResponseFormat.and(z.object({
    ticket: ticketType.optional()
}))

/// Request

export const ticketIdRequest = z.object({
    ticketId: uniqueId
})
export const ticketIdWithUserIdRequest = ticketIdRequest.and(z.object({
    uid: uniqueId
}))

export const goodsWithRemainDataSchema = z.object({key: goodsSchema, value: goodsRemainDataSchema})


export type GoodsWithRemainData = z.infer<typeof goodsWithRemainDataSchema>

export const listGoodsResponse = defaultResponseFormat.and(z.object({
    data: z.array(goodsWithRemainDataSchema)
}))

// TODO Error Message Handling
export const submitOrderResponse = defaultResponseFormat.and(z.object({
    paymentSessionId: z.string()
}).or(z.object({
    error: z.literal("一部の商品の在庫がなくなりました"),
    missedItems: z.array(z.string())
})))

export const listPaymentResponse = defaultResponseFormat.and(z.object({
    payments: z.array(paymentSessionSchema)
}))

export const paymentStatusResponse = defaultResponseFormat.and(z.object({
    payment: paymentSessionSchema
}))

export const paymentIdRequest = z.object({
    // shopなどがお客さんの決済履歴を調べるときに使用
    userId: uniqueId.optional(),
    paymentId: uniqueId
})

export type PaymentIdRequest = z.infer<typeof paymentIdRequest>

export const markPaymentPaidRequest = z.object({
    userId: uniqueId,
    paymentId: uniqueId,
    paidAmount: z.number(),
    paidMeans: z.string(),
    remark: z.string().optional()
})