import {firestore} from "firebase-admin";
import {Ticket, ticketSchema} from "./types";
import {ZodType} from "zod";
import Firestore = firestore.Firestore;
import DocumentReference = firestore.DocumentReference;
import DocumentData = firestore.DocumentData;

export type DBRefs = {
    tickets: firestore.CollectionReference<firestore.DocumentData>
}

/**
 * Generating DBRefs
 * @param db
 */
export function dbrefs(db: Firestore): DBRefs {
    return {
        tickets: db.collection("tickets"),
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
