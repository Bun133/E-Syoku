import {DBRefs, parseData, setData} from "../utils/db";
import {SingleError, SingleResult, Success, TypedSingleResult} from "../types/errors";
import {TicketBarcodeBindData, ticketBarcodeBindDataSchema} from "../types/barcode";
import {getTickets, ticketById} from "./ticket";
import {barcodeMatchTooMuch, barcodeNotMatch, dbNotFoundError, injectError, isSingleError} from "./errors";
import {judgeBarcode} from "./barcodeInfos";
import {Ticket} from "../types/ticket";

export async function getTicketBarcodeBindData(ref: DBRefs, barcode: string): Promise<TypedSingleResult<TicketBarcodeBindData>> {
    return parseData(dbNotFoundError("TicketBarcodeBindData"), ticketBarcodeBindDataSchema, ref.ticketBarcode(barcode), (data) => {
        return {
            barcode: barcode,
            ticketId: data.ticketId
        }
    })
}

/**
 * バーコードと食券IDを紐づけます
 * @param ref
 * @param barcode
 * @param ticketId
 */
export async function setTicketBarcodeBindData(ref: DBRefs, barcode: string, ticketId: string): Promise<SingleResult> {
    return setData(ticketBarcodeBindDataSchema.omit({barcode: true}), ref.ticketBarcode(barcode), {
        ticketId: ticketId,
    })
}

/**
 * 複数の食券IDが候補としてある中から適切にバーコードを紐づけます
 * @param ref
 * @param barcode
 * @param uid
 * @param ticketIds
 */
export async function bindBarcodeToTicket(ref: DBRefs, barcode: string, ticketIds: string[]): Promise<Success & {
    boundTicketId: string
} | SingleError> {
    const match = await judgeBarcode(ref, barcode)
    if (isSingleError(match)) {
        return match
    }

    const tickets = await getTickets(ref, ticketIds)
    const matches = tickets.filter((e) => e.shopId === match.info.shopId)
    if (matches.length === 0) {
        const error: SingleError = {
            isSuccess: false,
            ...injectError(barcodeNotMatch)
        }
        return error
    } else if (matches.length === 1) {
        const bind = await setTicketBarcodeBindData(ref, barcode, matches[0].uniqueId)
        if (isSingleError(bind)) {
            return bind
        }

        const suc: Success & {
            boundTicketId: string
        } = {
            isSuccess: true,
            boundTicketId: matches[0].uniqueId
        }
        return suc
    } else {
        const error: SingleError = {
            isSuccess: false,
            ...injectError(barcodeMatchTooMuch)
        }
        return error
    }
}

export async function ticketByBarcode(ref: DBRefs, barcode: string): Promise<TypedSingleResult<Ticket>> {
    const info = await getTicketBarcodeBindData(ref, barcode)
    if (isSingleError(info)) {
        return info
    } else {
        return await ticketById(ref, info.data.ticketId)
    }
}