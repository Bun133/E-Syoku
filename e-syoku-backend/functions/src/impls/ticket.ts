import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, newRandomRef, parseData, updateData} from "../db";
import DocumentReference = firestore.DocumentReference;
import {UniqueId} from "../types/types";
import {Order} from "../types/order";
import Timestamp = firestore.Timestamp;

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
    let ticketRef = await newRandomRef(ref.tickets);
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