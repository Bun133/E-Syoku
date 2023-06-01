import {firestore} from "firebase-admin";
import {Shop, shopSchema, Ticket, ticketSchema, TicketStatus, UniqueId} from "./types";
import {ZodType} from "zod";
import {v4 as uuidv4} from 'uuid';
import Firestore = firestore.Firestore;
import DocumentReference = firestore.DocumentReference;
import DocumentData = firestore.DocumentData;
import CollectionReference = firestore.CollectionReference;

export type DBRefs = {
    tickets: firestore.CollectionReference<firestore.DocumentData>,
    shops: firestore.CollectionReference<firestore.DocumentData>,
}

/**
 * Generating DBRefs
 * @param db
 */
export function dbrefs(db: Firestore): DBRefs {
    return {
        tickets: db.collection("tickets"),
        shops: db.collection("shops"),
    };
}

/**
 * Simply Parse data from db using zod type.
 * @param type
 * @param ref
 * @param processing
 */
function parseData<T, R>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, processing?: (data: DocumentData) => R): Promise<T | undefined> {
    return ref.get().then((doc) => {
        if (doc.exists) {
            let data = doc.data()!!;
            let processed: R | DocumentData = data
            if (processing) {
                processed = processing(data)
            }

            const parsed = type.safeParse(processed);
            if (parsed.success) {
                return parsed.data;
            }
            return undefined;
        } else {
            return undefined;
        }
    });
}

async function updateData(ref: DocumentReference<firestore.DocumentData>, toUpdate: Partial<DocumentData>): Promise<boolean> {
    const data = await ref.get();
    if (!data.exists) return false;
    await ref.update(toUpdate);
    return true;
}

/**
 * return random ref in [parent] collection. With checking if the ref is not taken.
 * @param parent
 */
async function newRandomRef(parent: CollectionReference): Promise<DocumentReference> {
    let uuid = uuidv4();
    let ref = parent.doc(uuid);
    let data = await ref.get();
    if (data.exists) {
        console.log("UUID Collided!")
        return newRandomRef(parent);
    }

    return ref;
}

export async function ticketById(ref: DBRefs, id: string): Promise<Ticket | undefined> {
    return ticketByRef(ref, ref.tickets.doc(id));
}

export async function ticketByRef(ref: DBRefs, ticketRef: DocumentReference<firestore.DocumentData>): Promise<Ticket | undefined> {
    return await parseData(ticketSchema, ticketRef, (data) => {
        return {
            uniqueId: ticketRef.id,
            ...data
        }
    });
}

export async function updateTicketById(ref: DBRefs, id: string, data: Partial<Ticket>): Promise<boolean> {
    return updateTicketByRef(ref, ref.tickets.doc(id), data);
}

export async function updateTicketByRef(ref: DBRefs, ticketRef: DocumentReference<firestore.DocumentData>, data: Partial<Ticket>): Promise<boolean> {
    return await updateData(ticketRef, data)
}

export async function shopById(ref: DBRefs, id: string): Promise<Shop | undefined> {
    return shopByRef(ref, ref.shops.doc(id));
}

export async function shopByRef(ref: DBRefs, shopRef: DocumentReference<firestore.DocumentData>): Promise<Shop | undefined> {
    return await parseData(shopSchema, shopRef, (data) => {
        return {
            shopId: shopRef.id,
            ...data
        }
    })
}

export async function registerNewTicket(ref: DBRefs, shopId: UniqueId, ticketNum: UniqueId, description: string | undefined): Promise<Ticket> {
    let ticketRef = await newRandomRef(ref.tickets);
    // TODO Check if shop exists with Authentication
    let data = {
        shopId: shopId,
        ticketNum: ticketNum,
        description: description,
        status: "PROCESSING" as TicketStatus
    }

    await ticketRef.set(data);

    return {
        ...data,
        uniqueId: ticketRef.id
    }
}