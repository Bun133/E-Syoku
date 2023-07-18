import * as admin from "firebase-admin";
import {dbrefs} from "./utils/db";
import {
    onPost,
    requireOptionalParameter,
    requireParameter,
    ResultOrPromise,
    standardFunction
} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authedWithType} from "./utils/auth";
import {AuthInstance} from "./types/auth";
import {listTicketForUser, ticketById, updateTicketStatus} from "./impls/ticket";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";
import {getAllPayments, getPaymentSessionById, markPaymentAsPaid} from "./impls/payment";
import {error} from "./utils/logger";
import {
    authFailedError,
    injectError,
    paymentNotFoundError,
    requestNotContainUserIdError,
    ticketNotFoundError
} from "./impls/errors";
import {Error, Success} from "./types/errors";
import {shopByRef} from "./impls/shop";
import {PaidDetail} from "./types/payment";
import {Timestamp} from "firebase-admin/firestore";
import {ticketDisplayDataByShopId} from "./impls/ticketDisplays";


admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();

export const ticketStatus = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ADMIN", "SHOP", "ANONYMOUS"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let ticketId = requireParameter("ticketId", z.string(), request);
            if (ticketId.param === undefined) return {result: ticketId.error}
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
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
            }
        })
    })
})

/**
 * List all tickets existing in the database
 */
export const listTickets = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
                let allTickets = await listTicketForUser(refs, authInstance.uid);

                const suc: Success = {
                    "isSuccess": true,
                    "tickets": allTickets
                }
                return {
                    result: suc
                }
            },
            () => {
                const err: Error = {
                    "isSuccess": false,
                    ...injectError(authFailedError)
                }
                return {
                    result: err
                }
            })
    })
});

/**
 * List all shops existing in the database
 */
export const listShops = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return await authedWithType(["ADMIN", "ANONYMOUS", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let docs = await refs.shops.listDocuments();
            let shops = await Promise.all(docs.map(async (doc) => {
                return await shopByRef(refs, doc);
            }))

            const suc: Success = {
                "isSuccess": true,
                "shops": shops.filter((it) => {
                    return it !== undefined
                })
            }
            return {
                result: suc
            }
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
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

function ticketStateChangeEndpoint(fromStatus: TicketStatus, toStatus: TicketStatus, successMessage: string): HttpsFunction {
    return standardFunction(async (request, response) => {
        await onPost(request, response, async () => {
            return authedWithType(["SHOP", "ADMIN"], auth, refs, request, response, async (_: AuthInstance) => {
                let userId = requireParameter("uid", z.string(), request)
                if (userId.param === undefined) return {result: userId.error}
                let id = requireParameter("ticketId", z.string(), request)
                if (id.param == undefined) return {result: id.error}

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
            }, () => {
                const err: Error = {
                    "isSuccess": false,
                    ...injectError(authFailedError)
                }
                return {
                    result: err
                }
            })
        })
    })
}

// 在庫がある商品リスト
export const listGoods = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            const goods = await getAllGoods(refs)
            const remainData = (await goods
                .filterNotNull({toLog: {message: "Null entry in retrieved goods list"}})
                .associateWithPromise((it) => getRemainDataOfGoods(refs, it.goodsId)))
                .filterValueNotNull({toLog: {message: "Failed to get remain data for some goods"}})

            const suc: Success = {"isSuccess": true, "data": remainData.toJson()}
            return {
                result: suc
            }
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
            }
        })
    })
})

// 注文内容データから新規決済セッション作成
export const submitOrder = standardFunction(async (request, response) => {
    await onPost(request, response, async () => {
        return authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            const order = requireParameter("order", orderSchema, request)
            if (order.param == undefined) return {result: order.error};
            const createPaymentResult = await createPaymentSession(refs, authInstance, order.param)
            if (!createPaymentResult.isSuccess) {
                const err: Error = createPaymentResult
                return {
                    statusCode: 400,
                    result: err
                }
            } else {
                // Succeeded in creating Payment Session
                const suc: Success = createPaymentResult
                return {
                    statusCode: 200,
                    result: suc
                }
            }
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
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
            const payments = await getAllPayments(refs, authInstance.uid)
            const suc: Success = {"isSuccess": true, "payments": payments}
            return {
                result: suc
            }
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
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
                userId = authInstance.uid
            } else if (authInstance.authType == "ADMIN" || authInstance.authType == "SHOP") {
                userId = requireOptionalParameter("userId", z.string().optional(), request).param
                if (!userId) {
                    // 自分のpaymentを見たい可能性
                    userId = authInstance.uid
                }
            }
            if (!userId) {
                // Failed to get User ID
                error("in paymentStatus Endpoint,failed to get User Id")
                const err: Error = {"isSuccess": false, ...injectError(requestNotContainUserIdError)}
                return {
                    statusCode: 500,
                    result: err
                }
            }

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
        }, () => {
            const err: Error = {
                "isSuccess": false,
                ...injectError(authFailedError)
            }
            return {
                result: err
            }
        })
    })
})

/**
 * 決済セッションのステータスをPAIDに変更します
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

            const paidDetail: PaidDetail = {
                paymentId: paymentId.param,
                customerId: userId.param,
                paymentStaffId: authInstance.uid,
                paidTime: Timestamp.now(),
                paidAmount: paidAmount.param,
                paidMeans: paidMeans.param,
                remark: remark.param
            }

            const result = await markPaymentAsPaid(refs, userId.param, paymentId.param, paidDetail)
            return {
                result: result
            }
        }, () => {
            return {
                result: {
                    "isSuccess": false,
                    ...injectError(authFailedError)
                }
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
            let shopId: string
            if (authInstance.authType == "SHOP") {
                shopId = authInstance.shopId
            } else {
                const param = requireParameter("shopId", z.string(), req)
                if (param.param == undefined) return {result: param.error}
                shopId = param.param
            }
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
        }, () => {
            const r:ResultOrPromise = {
                result: {
                    "isSuccess": false,
                    ...injectError(authFailedError)
                }
            }
            return r
        })
    })
})