import {DBRefs, mergeData, parseData, parseDataAll} from "../utils/db";
import {TicketDisplayData, ticketDisplaySchema} from "../types/ticketDisplays";
import {Ticket} from "../types/ticket";
import {firestore} from "firebase-admin";
import Transaction = firestore.Transaction;
import {Timestamp} from "firebase-admin/firestore";
import {TypedSingleResult} from "../types/errors";
import {notFoundError} from "./errors";

export async function ticketDisplayDataByTicketId(ref: DBRefs, shopId: string, ticketId: string):Promise<TypedSingleResult<TicketDisplayData>> {
    return parseData(notFoundError("ticketDisplayData"),ticketDisplaySchema, ref.ticketDisplays(shopId).doc(ticketId))
}

export async function ticketDisplayDataByShopId(ref: DBRefs, shopId: string): Promise<TicketDisplayData[]> {
    return parseDataAll(ticketDisplaySchema, ref.ticketDisplays(shopId))
}

/***
 * 与えられたTicketのデータをもとに、TicketDisplayのデータを更新
 * @param ref
 * @param ticket
 * @param transaction
 */
export async function updateTicketDisplayDataForTicket(ref: DBRefs, ticket: Ticket, transaction?: Transaction) {
    return mergeData(ticketDisplaySchema, ref.ticketDisplays(ticket.shopId).doc(ticket.uniqueId), {
        status: ticket.status,
        ticketId: ticket.uniqueId,
        ticketDataRef: ref.tickets(ticket.customerId).doc(ticket.uniqueId),
        ticketNum: ticket.ticketNum,
        lastUpdated: Timestamp.now()
    }, transaction)
}
