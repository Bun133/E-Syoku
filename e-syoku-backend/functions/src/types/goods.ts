import {uniqueId} from "./types";
import {z} from "zod";

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
export const goodsRemainDataSchema = remainNumberSchema.or(remainBooleanSchema)

export type GoodsRemainData = z.infer<typeof goodsRemainDataSchema>


/**
 * 特定の商品の受け取りを待っている人数のデータ
 */
export const waitingDataSchema = z.object({
    goodsId: uniqueId,
    waiting: z.number()
})

export type WaitingData = z.infer<typeof waitingDataSchema>