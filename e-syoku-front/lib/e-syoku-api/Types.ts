import {z} from "zod"

export const uniqueId = z.string()

export const ticketStatus = z.enum(["PROCESSING", "CALLED", "INFORMED", "RESOLVED"])

const timeStampSchema = z.object({
    _second: z.number(),
    _nanosecond: z.number()
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


export const defaultResponseFormat = z.object({
    isSuccess: z.boolean(),
    success: z.string().optional(),
    error: z.string().optional(),
})

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
    ticketId: uniqueId,
    uid: uniqueId
})

export const goodsWithRemainDataSchema = z.object({key: goodsSchema, value: goodsRemainDataSchema})


export type GoodsWithRemainData = z.infer<typeof goodsWithRemainDataSchema>

export const listGoodsResponse = defaultResponseFormat.and(z.object({
    data: z.array(goodsWithRemainDataSchema)
}))