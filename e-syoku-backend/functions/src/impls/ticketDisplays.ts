import {DBRefs, mergeData, parseData, parseDataAll} from "../utils/db";
import {TicketDisplayData, ticketDisplaySchema} from "../types/ticketDisplays";
import {Ticket} from "../types/ticket";
import {firestore} from "firebase-admin";
import Transaction = firestore.Transaction;
import {Timestamp} from "firebase-admin/firestore";
import {TypedSingleResult} from "../types/errors";
import {dbNotFoundError} from "./errors";

export async function ticketDisplayDataByTicketId(ref: DBRefs, shopId: string, ticketId: string):Promise<TypedSingleResult<TicketDisplayData>> {
    return parseData(dbNotFoundError("ticketDisplayData"),ticketDisplaySchema, ref.ticketDisplays(shopId).doc(ticketId))
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
        ticketDataRef: ref.tickets.doc(ticket.uniqueId),
        ticketNum: ticket.ticketNum,
        uid:ticket.customerId,
        lastUpdated: Timestamp.now()
    }, transaction)
}
