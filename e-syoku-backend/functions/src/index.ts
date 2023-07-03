import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs} from "./utils/db";
import {applyHeaders, endOfEndPoint, handleOption, onPost, requireParameter} from "./utils/endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";
import {TicketStatus} from "./types/ticket";
import {authed, authedWithType} from "./utils/auth";
import {AuthInstance} from "./types/auth";
import {listTicketForUser, ticketById, updateTicketById} from "./impls/ticket";
import {shopByRef} from "./impls/shop";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import "./utils/collectionUtils"
import {orderSchema} from "./types/order";
import {createPaymentSession} from "./impls/order";


admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();

export const ticketStatus = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        await authedWithType(["ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            let ticketId = requireParameter("ticketId", z.string(), request, response);
            let uid = requireParameter("uid", z.string(), request, response);
            if (!ticketId || !uid) return
            let ticket = await ticketById(refs, uid, ticketId);
            if (ticket === undefined) {
                response.status(404).send({
                    "isSuccess": false,
                    "error": "Ticket not found"
                }).end()
                return
            }

            response.status(200).send({
                "isSuccess": true,
                "ticket": ticket
            }).end()
        }, () => {
        })
    })

    endOfEndPoint(request, response)
})

/**
 * List all tickets existing in the database
 */
export const listTickets = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        await authedWithType(["ANONYMOUS", "ADMIN", "SHOP"], auth, refs, request, response, async (authInstance: AuthInstance) => {
                let allTickets = await listTicketForUser(refs, authInstance.uid);

                response.status(200).send({
                    "isSuccess": true,
                    "tickets": allTickets
                }).end()
            },
            () => {
                response.status(401).send({"isSuccess": false, "error": "Authentication failed"}).end()
            })
    })

    endOfEndPoint(request, response)
});

/**
 * List all shops existing in the database
 */
export const listShops = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    let docs = await refs.shops.listDocuments();
    let shops = await Promise.all(docs.map(async (doc) => {
        return await shopByRef(refs, doc);
    }))

    response.status(200).send({
        "isSuccess": true,
        "shops": shops.filter((it) => {
            return it !== undefined
        })
    }).end()

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
    return functions.region("asia-northeast1").https.onRequest(async (request, response) => {
        applyHeaders(response)
        if (handleOption(request, response)) return

        await onPost(request, response, async () => {
            await authed(auth, refs, request, response, async (authInstance: AuthInstance) => {
                let id = requireParameter("ticketId", z.string(), request, response)
                if (!id) return;

                let ticket = await ticketById(refs, authInstance.uid, id)
                if (!ticket) {
                    response.status(400).send({
                        "isSuccess": false,
                        "error": "Ticket for requested ID doesn't exist."
                    }).end()
                    return
                }
                if (ticket.status !== fromStatus) {
                    response.status(400).send({
                        "isSuccess": false,
                        "error": "Ticket for requested ID is not in " + fromStatus + " status. Actual Status: " + ticket.status
                    }).end()
                    return
                }

                let called = await updateTicketById(refs, authInstance.uid, id, {
                    status: toStatus
                })
                if (called) {
                    response.status(200).send({"isSuccess": true, "success": successMessage}).end()
                } else {
                    response.status(400).send({"isSuccess": false, "error": "Failed to Update Ticket Data"}).end()
                }

                return
            }, () => {
                response.status(401).send({"isSuccess": false, "error": "Authentication failed"}).end()
            })
        })

        endOfEndPoint(request, response)
    })
}

// 在庫がある商品リスト
export const listGoods = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        await authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            const goods = await getAllGoods(refs)
            const remainData = (await goods
                .filterNotNull({toLog: {message: "Null entry in retrieved goods list"}})
                .associateWithPromise((it) => getRemainDataOfGoods(refs, it.goodsId)))
                .filterValueNotNull({toLog: {message: "Failed to get remain data for some goods"}})
            response.status(200).send({"isSuccess": true, "data": remainData.toJson()}).end()
        }, () => {
            response.status(401).send({"isSuccess": false, "error": "Unauthorized"}).end()
        })
    })

    endOfEndPoint(request, response)
})

// 注文内容データから新規決済セッション作成
export const submitOrder = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        await authedWithType(["ANONYMOUS", "SHOP", "ADMIN"], auth, refs, request, response, async (authInstance: AuthInstance) => {
            const order = requireParameter("order", orderSchema, request, response)
            if (!order) return;
            const createPaymentResult = await createPaymentSession(refs, authInstance, order)
            if (!createPaymentResult.isSuccess) {
                response.status(400).send(createPaymentResult).end()
            }else{
                // Succeeded in creating Payment Session
                response.status(200).send(createPaymentResult).end()
            }
        }, () => {
            response.status(401).send({"isSuccess": false, "error": "Unauthorized"}).end()
        })
    })

    endOfEndPoint(request, response)
})