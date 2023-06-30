import {z} from "zod";
import {UserRecord} from "firebase-admin/auth";
import {timeStampSchema} from "../typeConv";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>


/////// Shop ///////

/**
 * Shop schema, expressing shop entry.
 */
export const shopSchema = z.object({
    name: z.string(),
    shopId: uniqueId,
});

export type Shop = z.infer<typeof shopSchema>

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


/////// Goods(商品) ////////

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

// 在庫データ
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


/////// Order(注文内容データ) ////////

/**
 * This type express an order.
 * It is not ensured that the order is valid or paid.
 */
export const orderSchema = z.object({
    items: z.array(z.object({
        // 商品ID
        goodsId: uniqueId,
        // 注文数
        count: z.number(),
    }))
})

export type Order = z.infer<typeof orderSchema>

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
    // 決済セッションID
    paymentSessionId: uniqueId,
    // 食券ステータスデータ
    status: ticketStatusSchema
});

export type Ticket = z.infer<typeof ticketSchema>