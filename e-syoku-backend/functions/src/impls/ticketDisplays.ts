import {DBRefs, parseData, parseDataAll} from "../utils/db";
import {TicketDisplayData, ticketDisplaySchema} from "../types/ticketDisplays";
import {TypedSingleResult} from "../types/errors";
import {dbNotFoundError} from "./errors";

export async function ticketDisplayDataByTicketId(ref: DBRefs, shopId: string, ticketId: string): Promise<TypedSingleResult<TicketDisplayData>> {
    return parseData(dbNotFoundError("ticketDisplayData"), ticketDisplaySchema, ref.ticketDisplays(shopId).doc(ticketId))
}

export async function ticketDisplayDataByShopId(ref: DBRefs, shopId: string): Promise<TicketDisplayData[]> {
    return parseDataAll(ticketDisplaySchema, ref.ticketDisplays(shopId))
}