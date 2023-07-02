import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, newRandomRef, parseData, updateData} from "../utils/db";
import {UniqueId} from "../types/types";
import {Order} from "../types/order";
import DocumentReference = firestore.DocumentReference;
import Timestamp = firestore.Timestamp;

/**
 * Should not be called directly.
 * @param ref
 * @param uid
 * @param ticketId
 */
export async function ticketById(ref: DBRefs, uid: string, ticketId: string): Promise<Ticket | undefined> {
    return ticketByRef(ref, uid, ref.tickets(uid).doc(ticketId));
}

/**
 * Should not be called directly.
 * @param ref
 * @param uid
 * @param ticketRef
 */
export async function ticketByRef(ref: DBRefs, uid: string, ticketRef: DocumentReference<firestore.DocumentData>): Promise<Ticket | undefined> {
    return await parseData(ticketSchema, ticketRef, (data) => {
        return {
            uniqueId: ticketRef.id,
            customerId: uid,
            ...data
        }
    });
}

/**
 * List tickets for the user
 * @param ref
 * @param uid
 */
export async function listTicketForUser(ref: DBRefs, uid: string): Promise<Array<Ticket>> {
    const ticketsCollectionRef = ref.tickets(uid)
    const ticketsSnapshot = await ticketsCollectionRef.listDocuments();
    return (await Promise.all(ticketsSnapshot.map(ticketRef => ticketByRef(ref, uid, ticketRef)))).filterNotNull();
}

/**
 * This function should not be called directly.
 * @param ref
 * @param uid
 * @param ticketId
 * @param data
 */
export async function updateTicketById(ref: DBRefs, uid: string, ticketId: string, data: Partial<Ticket>): Promise<boolean> {
    return updateTicketByRef(ref, ref.tickets(uid).doc(ticketId), data);
}

/**
 * This function should not be called directly.
 * @param ref
 * @param ticketRef
 * @param data
 */
export async function updateTicketByRef(ref: DBRefs, ticketRef: DocumentReference<firestore.DocumentData>, data: Partial<Ticket>): Promise<boolean> {
    return await updateData(ticketRef, data)
}

/**
 * Register New Ticket.
 * This function should not be called directly.
 * @param ref
 * @param shopId
 * @param ticketNum
 * @param customerId
 * @param orderData
 * @param paymentSessionId
 */
export async function registerNewTicket(ref: DBRefs,
                                        shopId: UniqueId,
                                        ticketNum: UniqueId,
                                        customerId: UniqueId,
                                        orderData: Order,
                                        paymentSessionId: UniqueId): Promise<Ticket> {
    let ticketRef = await newRandomRef(ref.tickets(customerId));
    // TODO Check if shop exists with Authentication
    let data = {
        ticketNum: ticketNum,
        shopId: shopId,
        customerId: customerId,
        issueTime: Timestamp.now(),
        orderData: orderData,
        paymentSessionId: paymentSessionId,
        status: "PROCESSING" as TicketStatus
    }

    await ticketRef.set(data);


    return {
        uniqueId: ticketRef.id,
        ...data
    }
}