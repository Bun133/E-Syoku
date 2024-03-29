import {createData, DBRefs, newRandomRef, parseData, updateEntireData} from "../utils/db";
import {Ticket, ticketSchema} from "../types/ticket";
import {SingleError, SingleResult, Success, TypedSingleResult} from "../types/errors";
import {injectError, dbNotFoundError, ticketNumGenerateFailedError, isSingleError} from "./errors";
import {TicketNumInfo, ticketNumInfoSchema} from "../types/ticketNumInfos";
import {firestore} from "firebase-admin";
import Transaction = firestore.Transaction;

export async function ticketNumInfoById(ref: DBRefs, shopId: string, transaction?: Transaction):Promise<TypedSingleResult<TicketNumInfo>> {
    return parseData(dbNotFoundError("ticketNumInfo"),ticketNumInfoSchema, ref.ticketNumInfo(shopId), undefined, transaction)
}

export async function updateLastTicketNum(ref: DBRefs, ticket: Ticket, transaction?: Transaction): Promise<SingleResult> {
    return updateEntireData(ticketNumInfoSchema.omit({ticketNumConfig: true}), ref.ticketNumInfo(ticket.shopId), {lastTicketNum: ticket.ticketNum}, transaction)
}

/**
 * ticketNum以外のデータがそろっているチケットを登録します
 * @param ref
 * @param shopId
 * @param ticket
 */
export async function createNewTicket(ref: DBRefs, shopId: string, ticket: (ticketId:string,ticketNum: string) => Ticket): Promise<Success & { ticket: Ticket } | SingleError> {
    return await ref.db.runTransaction(async (transaction) => {
        // ランダムに新しいRefを取得してチケットを登録
        // さすがに被らないと信じてるぞUUID
        const toWriteRef = await newRandomRef(ref.tickets)
        const info = await ticketNumInfoById(ref, shopId, transaction)
        if (isSingleError(info)) {
            return info
        }
        const next = nextTicketNum(info.data)
        if (isSingleError(next)) {
            return next
        }
        const ticketData: Ticket = ticket(toWriteRef.id,next.suggestingNextTicketNum)

        // チケットデータを書き込み
        const create = await createData(ticketSchema, toWriteRef, ticketData)
        if (isSingleError(create)) return create
        // LastTicketNumを更新
        const last = await updateLastTicketNum(ref, ticketData, transaction)
        if (isSingleError(last)) return last

        const suc: Success & { ticket: Ticket } = {
            isSuccess: true,
            ticket: ticketData
        }
        return suc
    })
}
function nextTicketNum(info: TicketNumInfo): SingleError & { failedReason: string } | Success & {
    suggestingNextTicketNum: string
} {
    const {ticketNumLeading} = info.ticketNumConfig || {}
    if (ticketNumLeading) {
        const removed = info.lastTicketNum.replace(ticketNumLeading, "")
        const parsedInt = parseInt(removed)
        if (!isFinite(parsedInt)) {
            const err: SingleError & { failedReason: string } = {
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
            const err: SingleError & { failedReason: string } = {
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
