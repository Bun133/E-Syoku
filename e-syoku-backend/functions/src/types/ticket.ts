import {timeStampSchema, uniqueId} from "./types";
import {orderSchema} from "./order";
import {z} from "zod";


/////// Ticket(食券データ) ///////


// 食券ステータスデータ


export const ticketStatusSchema = z.union([
    // ①調理前
    z.literal("PROCESSING"),
    // ②調理中
    z.literal("COOKING"),
    // ③調理済み・受け取り前
    z.literal("CALLED"),
    // ④受け取り後
    z.literal("RESOLVED"),
    // ⑤呼び出し(何かあったとき)
    z.literal("INFORMED"),
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>

// 食券データ
export const ticketSchema = z.object({
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
    // DB検索用の注文した商品のID一覧
    goodsIds: z.string().array(),
    // 決済セッションID
    paymentSessionId: uniqueId,
    // 食券ステータスデータ
    status: ticketStatusSchema,
    // 最後にステータスが変更された時刻
    lastStatusUpdated: timeStampSchema
});

export type Ticket = z.infer<typeof ticketSchema>