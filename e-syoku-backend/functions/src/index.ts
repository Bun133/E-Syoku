import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs, shopByRef, ticketByRef} from "./db";
import {Ticket} from "./types";

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
    }))
});

export const listShops = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    let docs = await refs.shops.listDocuments();
    let shops = await Promise.all(docs.map(async (doc) => {
        return await shopByRef(refs, doc);
    }))

    response.status(200).send(shops.filter((it) => {
        return it !== undefined
    }))
})