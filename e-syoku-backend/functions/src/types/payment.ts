import {timeStampSchema, uniqueId} from "./types";
import {orderSchema} from "./order";
import {z} from "zod";


/////// Payment(決済セッションデータ) ////////

// 決済完了データ

export const paidDetailSchema = z.object({
    // 決済ID
    paymentId: uniqueId,
    // 決済取扱者ID
    paymentStaffId: uniqueId,
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
    // バーコード
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
    // 決済完了後に発行される食券のIDたち
    boundTicketId: uniqueId.array().optional(),
    // 決済セッション作成時刻
    paymentCreatedTime: timeStampSchema,
})

export type PaymentSession = z.infer<typeof paymentSessionSchema>
export const paymentSessionDataWithRemainCheckSchema = paymentSessionSchema.and(
    z.object({remains: z.literal(true)}).or(
        z.object({remains: z.literal(false)})
    )
)