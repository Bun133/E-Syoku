import {DBRefs, parseData, parseDataAll, updateEntireData} from "../utils/db";
import {ticketDisplaySchema} from "../types/ticketDisplays";
import {Ticket} from "../types/ticket";

export async function ticketDisplayDataByTicketId(ref: DBRefs, shopId: string, ticketId: string) {
    return parseData(ticketDisplaySchema, ref.ticketDisplays(shopId).doc(ticketId), (data) => {
        return {
            ...data,
            ticketId: ticketId
        }
    })
}

export async function ticketDisplayDataByShopId(ref: DBRefs, shopId: string) {
    return parseDataAll(ticketDisplaySchema, ref.ticketDisplays(shopId), (data) => {
        return {
            ...data,
            ticketId: data.id
        }
    })
}

// TODO make this transactional
/***
 * 与えられたTicketのデータをもとに、TicketDisplayのデータを更新
 * @param ref
 * @param ticket
 */
export async function updateTicketDisplayDataForTicket(ref: DBRefs, ticket: Ticket) {
    return updateEntireData(ticketDisplaySchema, ref.ticketDisplays(ticket.shopId).doc(ticket.uniqueId), {
        status: ticket.status,
        ticketId: ticket.uniqueId,
        ticketDataRef: ref.tickets(ticket.customerId).doc(ticket.uniqueId),
        ticketNum: ticket.ticketNum,
    })
}
