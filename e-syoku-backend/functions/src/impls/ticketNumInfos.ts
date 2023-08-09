import {createData, DBRefs, newRandomRef, parseData, updateEntireData} from "../utils/db";
import {Ticket, ticketSchema} from "../types/ticket";
import {Error, Success, TypedSingleResult} from "../types/errors";
import {injectError, notFoundError, ticketNumGenerateFailedError, ticketNumInfoNotFound} from "./errors";
import {TicketNumInfo, ticketNumInfoSchema} from "../types/ticketNumInfos";
import {firestore} from "firebase-admin";
import {updateTicketDisplayDataForTicket} from "./ticketDisplays";
import Transaction = firestore.Transaction;

export async function ticketNumInfoById(ref: DBRefs, shopId: string, transaction?: Transaction):Promise<TypedSingleResult<TicketNumInfo>> {
    return parseData(notFoundError("ticketNumInfo"),ticketNumInfoSchema, ref.ticketNumInfo(shopId), undefined, transaction)
}

export async function updateLastTicketNum(ref: DBRefs, ticket: Ticket, transaction?: Transaction) {
    return updateEntireData(ticketNumInfoSchema.omit({ticketNumConfig: true}), ref.ticketNumInfo(ticket.shopId), {lastTicketNum: ticket.ticketNum}, transaction)
}

/**
 * ticketNum以外のデータがそろっているチケットを登録します
 * @param ref
 * @param shopId
 * @param uid
 * @param ticket
 */
export async function createNewTicket(ref: DBRefs, shopId: string, uid: string, ticket: (ticketId:string,ticketNum: string) => Ticket): Promise<Success & { ticket: Ticket } | Error> {
    return await ref.db.runTransaction(async (transaction) => {
        // ランダムに新しいRefを取得してチケットを登録
        // さすがに被らないと信じてるぞUUID
        const toWriteRef = await newRandomRef(ref.tickets(uid))
        const info = await ticketNumInfoById(ref, shopId, transaction)
        if (!info.isSuccess) {
            const err: Error = {
                isSuccess: false,
                ...injectError(ticketNumInfoNotFound)
            }
            return err
        }
        const next = nextTicketNum(info.data)
        if (!next.isSuccess) {
            const err: Error = next
            return err
        }
        const ticketData: Ticket = ticket(toWriteRef.id,next.suggestingNextTicketNum)

        // チケットデータを書き込み
        const create = await createData(ticketSchema, toWriteRef, ticketData)
        if (!create.isSuccess) return create
        // LastTicketNumを更新
        const last = await updateLastTicketNum(ref, ticketData, transaction)
        if (!last.isSuccess) return last
        // TicketDisplayDataを更新
        const display = await updateTicketDisplayDataForTicket(ref, ticketData)
        if (!display.isSuccess) return display

        const suc: Success & { ticket: Ticket } = {
            isSuccess: true,
            ticket: ticketData
        }
        return suc
    })
}
function nextTicketNum(info: TicketNumInfo): Error & { failedReason: string } | Success & {
    suggestingNextTicketNum: string
} {
    const {ticketNumLeading} = info.ticketNumConfig || {}
    if (ticketNumLeading) {
        const removed = info.lastTicketNum.replace(ticketNumLeading, "")
        const parsedInt = parseInt(removed)
        if (!isFinite(parsedInt)) {
            const err: Error & { failedReason: string } = {
                isSuccess: false,
                ...injectError(ticketNumGenerateFailedError),
                failedReason: "removed is not a number,not finite"
            }
            return err
        }
        const next = parsedInt + 1

        const generated = `${ticketNumLeading}${next}`
        const suc: Success & { suggestingNextTicketNum: string } = {
            isSuccess: true,
            suggestingNextTicketNum: generated
        }
        return suc
    } else {
        const parsedInt = parseInt(info.lastTicketNum)
        if (!isFinite(parsedInt)) {
            const err: Error & { failedReason: string } = {
                isSuccess: false,
                ...injectError(ticketNumGenerateFailedError),
                failedReason: "removed is not a number,not finite(without leading info)"
            }
            return err
        }
        const next = parsedInt + 1
        const generated = `${next}`
        const suc: Success & { suggestingNextTicketNum: string } = {
            isSuccess: true,
            suggestingNextTicketNum: generated
        }
        return suc
    }
}
