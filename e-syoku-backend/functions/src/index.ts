import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {dbrefs, ticketByRef} from "./db";
import {Ticket} from "./types";

admin.initializeApp()
const db = admin.firestore();
const refs = dbrefs(db);

export const helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

/**
 * List all tickets existing in the database
 */
export const listTickets = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    let docs = await refs.tickets.listDocuments();
    console.log("docs", docs)
    let tickets: Awaited<Ticket | undefined>[] = await Promise.all(docs.map(async (doc) => {
        return await ticketByRef(refs, doc);
    }))
    console.log("tickets", tickets)

    response.status(200).send(tickets.filter((it) => {
        return it !== undefined
    }))
});
