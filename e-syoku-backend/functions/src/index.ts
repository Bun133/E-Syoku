import * as admin from "firebase-admin";
import {dbrefs} from "./utils/db";
import {onPost, requireOptionalParameter, requireParameter, standardFunction} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authed, authedWithType} from "./utils/auth";
import {AuthInstance, AuthTypeSchema} from "./types/auth";
import {listTicketForUser, ticketById, updateTicketStatusByIds} from "./impls/ticket";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";
import {getAllPayments, getPaymentSessionById, markPaymentAsPaid} from "./impls/payment";
import {error} from "./utils/logger";
import {
    authFailedError,
    barcodeInvalidError,
    injectError,
    paymentNotFoundError,
    requestNotContainUserIdError,
    ticketNotFoundError,
    ticketNotSpecifiedError
} from "./impls/errors";
import {Error, Success} from "./types/errors";
import {listAllShop} from "./impls/shop";
import {PaidDetail} from "./types/payment";
import {Timestamp} from "firebase-admin/firestore";
import {ticketDisplayDataByShopId} from "./impls/ticketDisplays";
import {grantPermissionToUser} from "./impls/auth";
import {bindBarcodeToTicket, getBarcodeBindData} from "./impls/barcode";
import {cmsFunction, satisfyCondition} from "./cms";
import {addMessageToken, NotificationData, sendMessage} from "./impls/notification";


admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();
// @ts-ignore
const messaging = admin.messaging();

/**
 * リクエストユーザーの[ticketId]に該当するチケットデータを返却します
 * Param:
 *  - ticketId: string
 *  - uid:string(optional)
 * Response:
 *  - ticket: Ticket
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const ticketStatus = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ADMIN", "CASHIER", "SHOP", "ANONYMOUS"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let ticketId = requireParameter("ticketId", z.string(), request);
            if (ticketId.param === undefined) return {result: ticketId.error}
            let uid = requireOptionalParameter("uid", z.string().optional(), request).param ?? authInstance.uid

            // チケットデータ取得
            let ticket = await ticketById(refs, uid, ticketId.param);
            if (ticket === undefined) {
                const err: Error = {
                    "isSuccess": false,
                    ...injectError(ticketNotFoundError)
                }
                return {
                    result: err
                }
            }

            const suc: Success = {
                "isSuccess": true,
                "ticket": ticket,
            }
            return {
                result: suc
            }
        })
    })
})

/**
 * リクエストユーザーのすべてのチケットデータを返却します
 * Param:
 * Response:
 *  - tickets: Ticket[]
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const listTickets = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "CASHIER", "ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            // 要求ユーザーのすべてのチケットを取得します
            let allTickets = await listTicketForUser(refs, authInstance.uid);

            const suc: Success = {
                "isSuccess": true,
                "tickets": allTickets
            }
            return {
                result: suc
            }
        })
    })
});

/**
 * すべての店舗の情報を返却します
 * Param:
 * Response:
 *  - shops: Shop[]
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const listShops = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return await authedWithType(["ADMIN", "CASHIER", "ANONYMOUS", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let shops = await listAllShop(refs);

            const suc: Success = {
                "isSuccess": true,
                "shops": shops
            }
            return {
                result: suc
            }
        })
    })
})

/**
 * Change Ticket State from "PROCESSING" to "CALLED"
 */
export const callTicket =
    ticketStateChangeEndpoint("PROCESSING", "CALLED", "Successfully called")

/**
 * Change Ticket State from "CALLED" to "PROCESSING"
 */
export const cancelCalling =
    ticketStateChangeEndpoint("CALLED", "PROCESSING", "Successfully the call is cancelled")

/**
 * Change Ticket State from "CALLED" to "RESOLVED"
 */
export const resolveTicket =
    ticketStateChangeEndpoint("CALLED", "RESOLVED", "Successfully the call is resolved")

/**
 * [fromStatus]から[toStatus]へチケットのステータスを変更するようなエンドポイントを作成します
 * Param:
 *  - barcode:string
 *  or
 *  - uid:string
 *  - ticketId:string
 * Response:
 * Permission:
 *  - ADMIN
 *  - SHOP
 */
function ticketStateChangeEndpoint(fromStatus: TicketStatus, toStatus: TicketStatus, successMessage: string, sendNotification?: NotificationData): HttpsFunction {
    return standardFunction(async (request, response) => {
        await onPost(request, response, async () => {
            return authedWithType(["SHOP", "ADMIN"], auth, refs, request, response, async (_: AuthInstance) => {
                let barcode = requireOptionalParameter("barcode", z.string(), request);
                let uidParam = requireOptionalParameter("uid", z.string(), request);
                let ticketIdParam = requireOptionalParameter("ticketId", z.string(), request);

                let uid: string | undefined
                let ticketId: string | undefined

                if (barcode.param) {
                    // チケットのデータからUID,TicketIdを取得します
                    const barcodeData = await getBarcodeBindData(refs, barcode.param)
                    if (!barcodeData) {
                        const err: Error = {
                            isSuccess: false,
                            ...injectError(barcodeInvalidError)
                        }
                        return {
                            statusCode: 400,
                            result: err
                        }
                    }
                    uid = barcodeData.uid
                    ticketId = barcodeData.ticketId
                } else if (uidParam.param && ticketIdParam.param) {
                    uid = uidParam.param
                    ticketId = ticketIdParam.param
                }

                if (uid && ticketId) {
                    // チケットのステータスを変更します
                    let called = await updateTicketStatusByIds(refs, uid, ticketId, fromStatus, toStatus)
                    if (!called.isSuccess) {
                        const err: Error = called
                        return {
                            statusCode: 400,
                            result: err
                        }
                    }

                    // 通知を送信する場合は送信処理を行います
                    if (sendNotification) {
                        await sendMessage(refs, messaging, uid, sendNotification)
                    }

                    const suc: Success = {"isSuccess": true, "success": successMessage}
                    return {result: suc}
                } else {
                    const err: Error = {
                        "isSuccess": false,
                        ...injectError(ticketNotSpecifiedError)
                    }
                    return {
                        result: err
                    }
                }
            })
        })
    })
}

/**
 * すべての商品のデータを取得して返却します
 * Param:
 * Response:
 * - data: Map<string, Goods>
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const listGoods = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "CASHIER", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            // すべてのGoodsのデータを取得
            const goods = await getAllGoods(refs)
            // それぞれの在庫の状況を取得してMapにする
            // TODO 気持ち悪い書き方やめる
            const remainData = (await goods
                .associateWithPromise((it) => getRemainDataOfGoods(refs, it.goodsId)))
                .filterValueNotNull({toLog: {message: "Failed to get remain data for some goods"}})

            const suc: Success = {"isSuccess": true, "data": remainData.toJson()}
            return {
                result: suc
            }
        })
    })
})

/**
 * 受信した注文データから新規決済セッションを作成
 * Param:
 * - order: Order
 * Response:
 *  - paymentSessionId:string
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const submitOrder = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "CASHIER", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            const order = requireParameter("order", orderSchema, request)
            if (order.param == undefined) return {result: order.error};

            // 新規決済セッションを作成
            const createPaymentResult = await createPaymentSession(refs, authInstance, order.param)
            if (!createPaymentResult.isSuccess) {
                const err: Error = createPaymentResult
                return {
                    statusCode: 400,
                    result: err
                }
            } else {
                const suc: Success = createPaymentResult
                return {
                    statusCode: 200,
                    result: suc
                }
            }
        })
    })
})

/**
 * ユーザーに紐づいている決済セッションのデータをすべて送信します
 * Param:
 * Response:
 *  - payments:PaymentSession[]
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const listPayments = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "CASHIER", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            // ユーザーに紐づいているすべての決済セッションのデータを取得します
            const payments = await getAllPayments(refs, authInstance.uid)
            const suc: Success = {"isSuccess": true, "payments": payments}
            return {
                result: suc
            }
        })
    })
})

/**
 * 指定された決済セッションのデータを返却します
 * Param:
 *  - paymentId:string
 *  - userId:string(optional)
 * Response:
 *  - payment:PaymentSession
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 *  - ANONYMOUS
 */
export const paymentStatus = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "CASHIER", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            // id
            const id = requireParameter("paymentId", z.string(), request)
            if (id.param == undefined) return {result: id.error}
            let userId: string | undefined
            if (authInstance.authType == "ANONYMOUS") {
                // 匿名アカウントの場合はそのアカウントのUID
                userId = authInstance.uid
            } else if (authInstance.authType == "ADMIN" || authInstance.authType == "SHOP") {
                // 管理者アカウントや店舗アカウントの場合は他人の決済セッションを参照できるように
                userId = requireOptionalParameter("userId", z.string().optional(), request).param
                if (!userId) {
                    // userIdの指定がない場合は、自分のUIDに
                    userId = authInstance.uid
                }
            }
            if (!userId) {
                // UIDがなぜか指定されなかった
                error("in paymentStatus Endpoint,failed to get User Id")
                const err: Error = {"isSuccess": false, ...injectError(requestNotContainUserIdError)}
                return {
                    statusCode: 500,
                    result: err
                }
            }

            // UserIdとPaymentIdから決済セッションデータを取得
            const payment = await getPaymentSessionById(refs, userId, id.param)
            if (!payment) {
                const err: Error = {
                    "isSuccess": false,
                    ...injectError(paymentNotFoundError)
                }
                return {
                    result: err
                }
            }
            const suc: Success = {"isSuccess": true, "payment": payment}
            return {
                result: suc
            }
        })
    })
})

/**
 * 決済セッションのステータスをPAIDに変更します
 * 同時に、
 * ①在庫データの更新
 * ②食券の発行
 * を行います
 * Param:
 *  - userId:string
 *  - paymentId:string
 *  - paidAmount:number
 *  - paidMeans:string
 *  - remark:string(optional)
 * Response:
 *  - ticketsId:string[]
 * Permission:
 *  - ADMIN
 *  - CASHIER
 */
export const markPaymentPaid = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["ADMIN", "CASHIER"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            let userId = requireParameter("userId", z.string(), req)
            if (userId.param == undefined) return {result: userId.error}
            let paymentId = requireParameter("paymentId", z.string(), req)
            if (paymentId.param == undefined) return {result: paymentId.error}
            let paidAmount = requireParameter("paidAmount", z.number(), req)
            if (paidAmount.param == undefined) return {result: paidAmount.error}
            let paidMeans = requireParameter("paidMeans", z.string(), req)
            if (paidMeans.param == undefined) return {result: paidMeans.error}
            let remark = requireOptionalParameter("remark", z.string().optional(), req)

            // 要求データから生成された決済詳細データ
            const paidDetail: PaidDetail = {
                paymentId: paymentId.param,
                customerId: userId.param,
                paymentStaffId: authInstance.uid,
                paidTime: Timestamp.now(),
                paidAmount: paidAmount.param,
                paidMeans: paidMeans.param,
                remark: remark.param
            }

            // 決済セッションのステータスをPAIDに変更
            const result = await markPaymentAsPaid(refs, userId.param, paymentId.param, paidDetail)
            return {
                result: result
            }
        })
    })
})

/**
 * TicketDisplayのデータをすべて読み取って返却します
 * TODO クライアントから直接FirestoreをListenするかどうか
 * Param:
 *  - shipId:string
 * Response:
 *  - displays:TicketDisplayData[]
 * Permission:
 *  - ADMIN
 *  - CASHIER
 *  - SHOP
 */
export const ticketDisplay = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["SHOP", "CASHIER", "ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            const param = requireParameter("shopId", z.string(), req)
            if (param.param == undefined) return {result: param.error}
            const shopId = param.param

            const data = (await ticketDisplayDataByShopId(refs, shopId)).map((data) => {
                // Remove unnecessary DBRef field
                return {
                    status: data.status,
                    ticketId: data.ticketId,
                    ticketNum: data.ticketNum,
                    lastUpdated: data.lastUpdated
                }
            })
            const suc: Success = {
                isSuccess: true,
                displays: data
            }
            return {
                result: suc
            }
        })
    })
})

/**
 * リクエストを送信したユーザーの認証情報をもとに権限データを返却します
 * Param:
 * Response:
 *  - authType:AuthType
 * Permission:
 *  All
 */
export const authState = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authed(auth, refs, req, res, (authInstance) => {
            const suc: Success = {
                isSuccess: true,
                authType: authInstance.authType
            }
            return {
                result: suc,
                statusCode: 200
            }
        }, () => {
            const suc: Success = {
                isSuccess: true,
                authType: undefined
            }
            return {
                result: suc,
                statusCode: 200
            }
        })
    })
})

/**
 * 指定されたユーザーに権限を付与します
 * Param:
 *  - uid:string
 *  - authType:AuthType
 *  - shopId:string(optional)
 * Response:
 * Permission:
 *  - ADMIN
 */
export const grantPermission = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            const uid = requireParameter("uid", z.string(), req)
            if (uid.param == undefined) return {result: uid.error}
            const authType = requireParameter("authType", AuthTypeSchema, req)
            if (authType.param == undefined) return {result: authType.error}
            const shopId = requireOptionalParameter("shopId", z.string().optional(), req).param


            const result = await grantPermissionToUser(refs, uid.param, authType.param, shopId)
            return {
                result: result
            }
        })
    })
})

/**
 * バーコードと食券データを紐づけます
 * Param:
 *  - uid:string
 *  - ticketId:string
 *  - barcode:string
 * Response:
 * Permission:
 *  - ADMIN
 *  - CASHIER
 */
export const bindBarcode = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["ADMIN", "CASHIER"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            const uid = requireParameter("uid", z.string(), req)
            if (uid.param == undefined) return {result: uid.error}
            const ticketId = requireParameter("ticketId", z.string().array().nonempty(), req)
            if (ticketId.param == undefined) return {result: ticketId.error}
            const barcode = requireParameter("barcode", z.string(), req)
            if (barcode.param == undefined) return {result: barcode.error}

            const result = await bindBarcodeToTicket(refs, barcode.param, uid.param, ticketId.param)
            return {
                result: result
            }
        })
    })
})

/**
 * バーコードやuidなどから条件にマッチする食券一覧を返却します
 * Param:
 *  - uid:string(optional)
 *  - ticketId:string(optional)
 *  - barcode:string(optional)
 * Response:
 * Permission:
 *  - ADMIN
 */
export const cmsTicket = cmsFunction(auth, refs, async (authInstance: AuthInstance, req, res) => {
    return await satisfyCondition(refs, req)
})

export const listenNotification = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authed(auth, refs, req, res, async (authInstance) => {
            const token = requireParameter("token", z.string(), req)
            if (token.param == undefined) return {result: token.error}
            const res = await addMessageToken(refs, authInstance.uid, [token.param])
            return {
                result: res
            }
        }, () => {
            return {
                result: {
                    isSuccess: false,
                    ...injectError(authFailedError)
                }
            }
        })
    })
})