import * as admin from "firebase-admin";
import {dbrefs} from "./utils/db";
import {
    applyHeaders,
    endOfEndPoint,
    handleOption,
    onPost,
    requireOptionalParameter,
    requireParameter,
    ResultOrPromise
} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction, onRequest} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authed, authedWithType} from "./utils/auth";
import {AuthInstance} from "./types/auth";
import {listTicketForUser, ticketById, updateTicketById} from "./impls/ticket";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";
import {getAllPayments, getPaymentSessionById} from "./impls/payment";
import {error} from "./utils/logger";
import {
    authFailedError,
    failedToUpdateTicket,
    injectError,
    internalError,
    paymentNotFoundError,
    ticketNotFoundError,
    ticketStatusInvalidError
} from "./impls/errors";
import {Error, Success} from "./types/errors";
import {shopByRef} from "./impls/shop";


admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();

export const ticketStatus = onRequest({
    region: "asia-northeast1",
    memory: "256MiB",
    cpu: 1
}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
})

/**
 * List all tickets existing in the database
 */
export const listTickets = onRequest({
    region: "asia-northeast1",
    memory: "256MiB",
    cpu: 1
}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ANONYMOUS", "ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
});

/**
 * List all shops existing in the database
 */
export const listShops = onRequest({region: "asia-northeast1", memory: "256MiB", cpu: 1}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return await authedWithType<ResultOrPromise>(["ADMIN", "ANONYMOUS", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
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
    return onRequest({region: "asia-northeast1", memory: "256MiB", cpu: 1}, async (request, response) => {
        applyHeaders(response)
        if (handleOption(request, response)) return

        await onPost(request, response, async () => {
            return authed<ResultOrPromise>(auth, refs, request, response, async (authInstance: AuthInstance) => {
                let id = requireParameter("ticketId", z.string(), request)
                if (id.param == undefined) return {result: id.error}

                let ticket = await ticketById(refs, authInstance.uid, id.param)
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
                if (ticket.status !== fromStatus) {
                    const err: Error = {
                        "isSuccess": false,
                        ...injectError(ticketStatusInvalidError(fromStatus, ticket.status))
                    }
                    return {
                        statusCode: 400,
                        result: err
                    }
                }

                let called = await updateTicketById(refs, authInstance.uid, id.param, {
                    status: toStatus
                })
                if (called) {
                    const suc: Success = {"isSuccess": true, "success": successMessage}
                    return {result: suc}
                } else {
                    const err: Error = {"isSuccess": false, ...injectError(failedToUpdateTicket)}
                    return {
                        statusCode: 400,
                        result: err
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

        endOfEndPoint(request, response)
    })
}

// 在庫がある商品リスト
export const listGoods = onRequest({region: "asia-northeast1", memory: "256MiB", cpu: 1}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
})

// 注文内容データから新規決済セッション作成
export const submitOrder = onRequest({
    region: "asia-northeast1",
    memory: "256MiB",
    cpu: 1
}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
})

/**
 * ユーザーに紐づいている決済セッションのデータをすべて送信します
 */
export const listPayments = onRequest({
    region: "asia-northeast1",
    memory: "256MiB",
    cpu: 1
}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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

    endOfEndPoint(request, response)
})

/**
 * 指定された決済セッションのデータを返却します
 */
export const paymentStatus = onRequest({
    region: "asia-northeast1",
    memory: "256MiB",
    cpu: 1
}, async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        return authedWithType<ResultOrPromise>(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
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
                const err: Error = {"isSuccess": false, ...injectError(internalError("Failed to get User Id"))}
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

    endOfEndPoint(request, response)
})