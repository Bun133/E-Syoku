import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs, shopByRef, ticketById, ticketByRef, updateTicketById} from "./db";
import {Ticket, TicketStatus} from "./types";
import {endOfEndPoint, onPost, requireParameter} from "./endpointUtil";
import {z} from "zod";
import {HttpsFunction} from "firebase-functions/v2/https";

admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);

/**
 * List all tickets existing in the database
 */
export const listTickets = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    let docs = await refs.tickets.listDocuments();
    let tickets: Awaited<Ticket | undefined>[] = await Promise.all(docs.map(async (doc) => {
        return await ticketByRef(refs, doc);
    }))

    response.status(200).send(tickets.filter((it) => {
        return it !== undefined
    })).end()

    endOfEndPoint(request, response)
});

/**
 * List all shops existing in the database
 */
export const listShops = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    let docs = await refs.shops.listDocuments();
    let shops = await Promise.all(docs.map(async (doc) => {
        return await shopByRef(refs, doc);
    }))

    response.status(200).send(shops.filter((it) => {
        return it !== undefined
    })).end()

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
        await onPost(request, response, async () => {
            let id = requireParameter("ticketId", z.string(), request, response)
            if (!id) return;

            let ticket = await ticketById(refs, id)
            if (!ticket) {
                response.status(400).send({"error": "Ticket for requested ID doesn't exist."}).end()
                return
            }
            if (ticket.status !== fromStatus) {
                response.status(400).send({"error": "Ticket for requested ID is not in " + fromStatus + " status. Actual Status: " + ticket.status}).end()
                return
            }

            let called = await updateTicketById(refs, id, {
                status: toStatus
            })
            if (called) {
                response.status(200).send({"success": successMessage}).end()
            } else {
                response.status(400).send({"error": "Failed to Update Ticket Data"}).end()
            }

            return
        })

        endOfEndPoint(request, response)
    })
}