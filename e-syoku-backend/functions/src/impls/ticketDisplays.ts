import {DBRefs, parseDataAll} from "../utils/db";
import {TicketDisplayData, ticketDisplaySchema} from "../types/ticketDisplays";

export async function ticketDisplayDataByShopId(ref: DBRefs, shopId: string): Promise<TicketDisplayData[]> {
    return parseDataAll(ticketDisplaySchema, ref.ticketDisplays(shopId))
}