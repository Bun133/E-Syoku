import {DBRefs, parseData, setData} from "../utils/db";
import {Error, Result, Success, TypedSingleResult} from "../types/errors";
import {BarcodeBindData, barcodeBindDataSchema} from "../types/barcode";
import {getTickets, ticketById} from "./ticket";
import {barcodeMatchTooMuch, barcodeNotMatch, injectError} from "./errors";
import {judgeBarcode} from "./barcodeInfos";
import {Ticket} from "../types/ticket";

export async function getBarcodeBindData(ref: DBRefs, barcode: string): Promise<TypedSingleResult<BarcodeBindData>> {
    return parseData("barcodeBindData", barcodeBindDataSchema, ref.binds(barcode), (data) => {
        return {
            barcode: barcode,
            ticketId: data.ticketId,
            uid: data.uid
        }
    })
}

/**
 * バーコードと食券IDを紐づけます
 * @param ref
 * @param barcode
 * @param uid
 * @param ticketId
 */
export async function setBarcodeBindData(ref: DBRefs, barcode: string, uid: string, ticketId: string): Promise<Result> {
    return setData(barcodeBindDataSchema.omit({barcode: true}), ref.binds(barcode), {
        ticketId: ticketId,
        uid: uid
    })
}

/**
 * 複数の食券IDが候補としてある中から適切にバーコードを紐づけます
 * @param ref
 * @param barcode
 * @param uid
 * @param ticketIds
 */
export async function bindBarcodeToTicket(ref: DBRefs, barcode: string, uid: string, ticketIds: string[]): Promise<Success & {
    boundTicketId: string
} | Error> {
    const match = await judgeBarcode(ref, barcode)
    if (!match.isSuccess) {
        return match
    }

    const tickets = await getTickets(ref, uid, ticketIds)
    const matches = tickets.filter((e) => e.shopId === match.info.shopId)
    if (matches.length === 0) {
        const error: Error = {
            isSuccess: false,
            ...injectError(barcodeNotMatch)
        }
        return error
    } else if (matches.length === 1) {
        const bind = await setBarcodeBindData(ref, barcode, uid, matches[0].uniqueId)
        if (!bind.isSuccess) {
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
        const error: Error = {
            isSuccess: false,
            ...injectError(barcodeMatchTooMuch)
        }
        return error
    }
}

export async function ticketByBarcode(ref: DBRefs, barcode: string): Promise<TypedSingleResult<Ticket>> {
    const info = await getBarcodeBindData(ref, barcode)
    if (!info.isSuccess) {
        return info
    } else {
        return await ticketById(ref, info.data.uid, info.data.ticketId)
    }
}