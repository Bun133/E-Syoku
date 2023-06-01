import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs, shopByRef, ticketByRef, updateTicketById} from "./db";
import {Ticket} from "./types";
import {endOfEndPoint, onPost, requireParameter} from "./endpointUtil";
import {z} from "zod";

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
});

export const listShops = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    let docs = await refs.shops.listDocuments();
    let shops = await Promise.all(docs.map(async (doc) => {
        return await shopByRef(refs, doc);
    }))

    response.status(200).send(shops.filter((it) => {
        return it !== undefined
    })).end()
})

export const callTicket = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    await onPost(request, response, async () => {
        let id = requireParameter("ticketId", z.string(), request, response)
        if (!id) return;
        let called = await updateTicketById(refs, id, {
            status: "CALLED"
        })
        if (called){
            response.status(200).send({"success": "Successfully called"}).end()
        }else{
            response.status(400).send({"error": "Ticket for requested ID doesn't exist."}).end()
        }

        return
    })

    endOfEndPoint(request, response)
})