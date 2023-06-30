import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs, getAllGoods, shopByRef, ticketById, ticketByRef, updateTicketById} from "./db";
import {Ticket, TicketStatus} from "./types/types";
import {applyHeaders, endOfEndPoint, handleOption, onPost, requireParameter} from "./endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";

admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);
// @ts-ignore
const auth = admin.auth();

export const ticketStatus = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        let ticketId = requireParameter("ticketId", z.string(), request, response);
        if (!ticketId) return
        let ticket = await ticketById(refs, ticketId);
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
    })

    endOfEndPoint(request, response)
})

/**
 * List all tickets existing in the database
 */
export const listTickets = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return


    let docs = await refs.tickets.listDocuments();
    let tickets: Awaited<Ticket | undefined>[] = await Promise.all(docs.map(async (doc) => {
        return await ticketByRef(refs, doc);
    }))

    response.status(200).send({
        "isSuccess": true,
        "tickets": tickets.filter((it) => {
            return it !== undefined
        })
    }).end()

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
            let id = requireParameter("ticketId", z.string(), request, response)
            if (!id) return;

            let ticket = await ticketById(refs, id)
            if (!ticket) {
                response.status(400).send({"isSuccess": false, "error": "Ticket for requested ID doesn't exist."}).end()
                return
            }
            if (ticket.status !== fromStatus) {
                response.status(400).send({
                    "isSuccess": false,
                    "error": "Ticket for requested ID is not in " + fromStatus + " status. Actual Status: " + ticket.status
                }).end()
                return
            }

            let called = await updateTicketById(refs, id, {
                status: toStatus
            })
            if (called) {
                response.status(200).send({"isSuccess": true, "success": successMessage}).end()
            } else {
                response.status(400).send({"isSuccess": false, "error": "Failed to Update Ticket Data"}).end()
            }

            return
        })

        endOfEndPoint(request, response)
    })
}

export const listGoods = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    applyHeaders(response)
    if (handleOption(request, response)) return

    await onPost(request, response, async () => {
        const data = await getAllGoods(refs)
        response.status(200).send({"isSuccess": true, "goods": data}).end()
    })

    endOfEndPoint(request, response)
})