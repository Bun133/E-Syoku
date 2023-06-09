import {uniqueId} from "./types";
import {z} from "zod";

/////// Order(注文内容データ) ////////

export const singleOrderSchema = z.object({
    // 商品ID
    goodsId: uniqueId,
    // 注文数
    count: z.number(),
})

/**
 * This type express an order.
 * It is not ensured that the order is valid or paid.
 */
export const orderSchema = z.array(singleOrderSchema)

export type SingleOrder = z.infer<typeof singleOrderSchema>
export type Order = z.infer<typeof orderSchema>