import * as admin from "firebase-admin";
import {dbrefs} from "./utils/db";
import {onPost, requireOptionalParameter, requireParameter, standardFunction} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authed, authedWithType} from "./utils/auth";
import {AuthInstance, AuthTypeSchema} from "./types/auth";
import {
    callTicketStackFunc,
    listTicketForShop,
    listTicketForUser,
    ticketById,
    updateTicketStatusByIds
} from "./impls/ticket";
import {getAllGoods, getRemainDataOfGoods, getWaitingDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";
import {getAllPayments, getPaymentSessionByBarcode, getPaymentSessionById, markPaymentAsPaid} from "./impls/payment";
import {
    authFailedError,
    injectError,
    paymentIdNotFoundError,
    paymentNotFoundError,
    ticketNotSpecifiedError
} from "./impls/errors";
import {Error, Success, TypedResult} from "./types/errors";
import {listAllShop} from "./impls/shop";
import {PaidDetail, PaymentSession} from "./types/payment";
import {Timestamp} from "firebase-admin/firestore";
import {grantPermissionToUser} from "./impls/auth";
import {bindBarcodeToTicket, getTicketBarcodeBindData} from "./impls/barcode";
import {cmsFunction, satisfyCondition} from "./cms";
import {addMessageToken, NotificationData} from "./impls/notification";
import {prettyGoods, prettyPayment, prettyTicket} from "./impls/prettyPrint";
import {PrettyTicket} from "./types/prettyPrint";


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

            // チケットデータ取得
            let ticket = await ticketById(refs, ticketId.param);
            if (!ticket.isSuccess) {
                return {result: ticket}
            }

            const pTicket = await prettyTicket(refs, ticket.data)
            if (!pTicket.isSuccess) {
                return {result: pTicket}
            }

            const suc: Success = {
                "isSuccess": true,
                "ticket": pTicket.data,
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

            const pTickets = await Promise.all(allTickets.map((e) => prettyTicket(refs, e)))

            // TODO Error Handling
            const suc: Success = {
                "isSuccess": true,
                "tickets": pTickets.filter(e => e.isSuccess).map(e => e.data)
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
                let barcode = requireOptionalParameter("barcode", z.string().optional(), request);
                let ticketIdParam = requireOptionalParameter("ticketId", z.string().optional(), request);

                let ticketId: string | undefined

                if (barcode.param) {
                    // チケットのデータからUID,TicketIdを取得します
                    const barcodeData = await getTicketBarcodeBindData(refs, barcode.param)
                    if (!barcodeData.isSuccess) {
                        const err: Error = barcodeData
                        return {
                            statusCode: 400,
                            result: err
                        }
                    }
                    ticketId = barcodeData.data.ticketId
                } else if (ticketIdParam.param) {
                    ticketId = ticketIdParam.param
                }

                if (ticketId) {
                    // チケットのステータスを変更します
                    let called = await updateTicketStatusByIds(refs, messaging, ticketId, fromStatus, toStatus, undefined, sendNotification)
                    if (!called.isSuccess) {
                        const err: Error = called
                        return {
                            statusCode: 400,
                            result: err
                        }
                    }

                    const pTicket = await prettyTicket(refs, called.targetTicket)
                    if (!pTicket.isSuccess) {
                        const err: Error = pTicket
                        return {
                            result: err
                        }
                    }

                    const suc: Success & { ticket: PrettyTicket } = {
                        "isSuccess": true,
                        "success": successMessage,
                        ticket: pTicket.data
                    }
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
            const data = (await Promise.all(goods.map(async g => {
                const pGoods = await prettyGoods(refs, g)
                if (!pGoods.isSuccess) {
                    return undefined
                }

                const remainData = await getRemainDataOfGoods(refs, g.goodsId)
                if (!remainData.isSuccess) {
                    return undefined
                }

                const waitingData = await getWaitingDataOfGoods(refs, g.goodsId)
                if (!waitingData.isSuccess) {
                    return undefined
                }

                return {
                    goods: pGoods.data,
                    remainData: remainData.data,
                    waitingData: waitingData.data
                }
            }))).filter(d => d != undefined)

            const suc: Success = {"isSuccess": true, "data": data}
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
            const id = requireOptionalParameter("paymentId", z.string().optional(), request)
            const barcode = requireOptionalParameter("barcode", z.string().optional(), request)

            if (id.param == undefined && barcode.param == undefined) {
                const err: Error = {
                    "isSuccess": false,
                    ...injectError(paymentIdNotFoundError)
                }
                return {
                    result: err
                }
            }

            // 決済セッションデータを取得
            let payment: PaymentSession | undefined
            if (id.param != undefined) {
                const r = await getPaymentSessionById(refs, id.param)
                if (r.isSuccess) {
                    payment = r.data
                } else {
                    return {result: r}
                }
            } else if (barcode.param != undefined) {
                payment = await getPaymentSessionByBarcode(refs, barcode.param)
            }

            if (!payment) {
                const err: Error = {
                    isSuccess: false,
                    ...injectError(paymentNotFoundError)
                }

                return {
                    result: err
                }
            }

            const pPayment = await prettyPayment(refs, payment)
            if (!pPayment.isSuccess) {
                return {result: pPayment}
            }


            const suc: Success = {"isSuccess": true, "payment": pPayment.data}
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
            let paidAmount = requireParameter("paidAmount", z.number(), req)
            if (paidAmount.param == undefined) return {result: paidAmount.error}
            let paidMeans = requireParameter("paidMeans", z.string(), req)
            if (paidMeans.param == undefined) return {result: paidMeans.error}
            let remark = requireOptionalParameter("remark", z.string().optional(), req)

            let paymentId = requireOptionalParameter("paymentId", z.string().optional(), req)
            let paymentBarcode = requireOptionalParameter("paymentBarcode", z.string().optional(), req)

            let pId: string | undefined
            if (paymentId.param != undefined) pId = paymentId.param
            if (paymentBarcode.param != undefined) pId = (await getPaymentSessionByBarcode(refs, paymentBarcode.param))?.sessionId
            if (pId == undefined) {
                const err: Error = {
                    isSuccess: false,
                    ...injectError(paymentIdNotFoundError)
                }
                return {result: err}
            }

            // 要求データから生成された決済詳細データ
            const paidDetail: PaidDetail = {
                paymentId: pId,
                paymentStaffId: authInstance.uid,
                paidTime: Timestamp.now(),
                paidAmount: paidAmount.param,
                paidMeans: paidMeans.param,
                remark: remark.param
            }

            // 決済セッションのステータスをPAIDに変更
            const result = await markPaymentAsPaid(refs, pId, paidDetail)
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

            const pTickets: TypedResult<PrettyTicket>[] = await Promise.all((await listTicketForShop(refs, shopId)).map(async e => prettyTicket(refs, e)))

            const data = pTickets.filter(e => e.isSuccess).map(e => e.data as PrettyTicket)

            const suc: Success = {
                isSuccess: true,
                tickets: data
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
            const ticketId = requireParameter("ticketId", z.string().array().nonempty(), req)
            if (ticketId.param == undefined) return {result: ticketId.error}
            const barcode = requireParameter("barcode", z.string(), req)
            if (barcode.param == undefined) return {result: barcode.error}

            const result = await bindBarcodeToTicket(refs, barcode.param, ticketId.param)
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

/**
 * 指定された人数まで自動的に呼び出します
 */
export const callTicketStack = standardFunction(async (req, res) => {
    await onPost(req, res, async () => {
        return authedWithType(["ADMIN", "SHOP"], auth, refs, req, res, async (authInstance: AuthInstance) => {
            const count = requireParameter("count", z.number(), req)
            if (count.param == undefined) return {result: count.error}
            const shopId = requireParameter("shopId", z.string(), req)
            if (shopId.param == undefined) return {result: shopId.error}

            const res = await callTicketStackFunc(refs, messaging, shopId.param, count.param)
            return {
                result: res
            }
        })
    })
})