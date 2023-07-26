import * as admin from "firebase-admin";
import {dbrefs} from "./utils/db";
import {onPost, requireOptionalParameter, requireParameter, standardFunction} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authed, authedWithType} from "./utils/auth";
import {AuthInstance, AuthTypeSchema} from "./types/auth";
import {listTicketForUser, ticketById, updateTicketStatus} from "./impls/ticket";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";
import {getAllPayments, getPaymentSessionById, markPaymentAsPaid} from "./impls/payment";
import {error} from "./utils/logger";
import {injectError, paymentNotFoundError, requestNotContainUserIdError, ticketNotFoundError} from "./impls/errors";
import {Error, Success} from "./types/errors";
import {listAllShop} from "./impls/shop";
import {PaidDetail} from "./types/payment";
import {Timestamp} from "firebase-admin/firestore";
import {ticketDisplayDataByShopId} from "./impls/ticketDisplays";
import {grantPermissionToUser} from "./impls/auth";


admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();

/**
 * リクエストユーザーの[ticketId]に該当するチケットデータを返却します
 * Param:
 *  - ticketId: string
 * Response:
 *  - ticket: Ticket
 * Permission:
 *  - ADMIN
 *  - SHOP
 *  - ANONYMOUS
 */
export const ticketStatus = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ADMIN", "SHOP", "ANONYMOUS"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let ticketId = requireParameter("ticketId", z.string(), request);
            if (ticketId.param === undefined) return {result: ticketId.error}
            // チケットデータ取得
            let ticket = await ticketById(refs, authInstance.uid, ticketId.param);
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
 *  - SHOP
 *  - ANONYMOUS
 */
export const listTickets = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
 *  - SHOP
 *  - ANONYMOUS
 */
export const listShops = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return await authedWithType(["ADMIN", "ANONYMOUS", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
 * @param fromStatus
 * @param toStatus
 * @param successMessage
 */
function ticketStateChangeEndpoint(fromStatus: TicketStatus, toStatus: TicketStatus, successMessage: string): HttpsFunction {
    return standardFunction(async (request, response) => {
        await onPost(request, response, async () => {
            return authedWithType(["SHOP", "ADMIN"], auth, refs, request, response, async (_: AuthInstance) => {
                // uid,ticketId
                let userId = requireParameter("uid", z.string(), request)
                if (userId.param === undefined) return {result: userId.error}
                let id = requireParameter("ticketId", z.string(), request)
                if (id.param == undefined) return {result: id.error}

                // チケットデータを取得
                // TODO updateTicketStatus内でチケットの存在を確認しているので不要
                let ticket = await ticketById(refs, userId.param, id.param)
                if (!ticket) {
                    const err: Error = {
                        "isSuccess": false,
                        ...injectError(ticketNotFoundError)
                    }
                    return {
                        statusCode: 400,
                        result: err
                    }
                }
                // チケットのステータスを変更します
                let called = await updateTicketStatus(refs, userId.param, id.param, fromStatus, toStatus)
                if (!called.isSuccess) {
                    const err: Error = called
                    return {
                        statusCode: 400,
                        result: err
                    }
                }

                const suc: Success = {"isSuccess": true, "success": successMessage}
                return {result: suc}
            })
        })
    })
}

/**
 * すべての商品のデータを取得して返却します
 */
export const listGoods = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            // すべてのGoodsのデータを取得
            const goods = await getAllGoods(refs)
            // それぞれの在庫の状況を取得してMapにする
            const remainData = (await goods
                .filterNotNull({toLog: {message: "Null entry in retrieved goods list"}})
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
 */
export const submitOrder = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
 */
export const listPayments = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
 */
export const paymentStatus = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
 */
export const markPaymentPaid = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["SHOP", "ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => {
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
 */
export const ticketDisplay = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["SHOP", "ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            const param = requireParameter("shopId", z.string(), req)
            if (param.param == undefined) return {result: param.error}
            const shopId = param.param
            const data = (await ticketDisplayDataByShopId(refs, shopId)).map((data) => {
                // Remove unnecessary DBRef field
                return {
                    status: data.status,
                    ticketId: data.ticketId,
                    ticketNum: data.ticketNum,
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