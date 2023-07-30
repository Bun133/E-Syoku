import {DBRefs, parseData, updateEntireData} from "../utils/db";
import {Ticket} from "../types/ticket";
import {Error, Success} from "../types/errors";
import {injectError, ticketNumGenerateFailedError} from "./errors";
import {error} from "../utils/logger";
import {ticketById} from "./ticket";
import {TicketNumInfo, ticketNumInfoSchema} from "../types/ticketNumInfos";
import {firestore} from "firebase-admin";
import Transaction = firestore.Transaction;

export async function ticketNumInfoById(ref: DBRefs, shopId: string, transaction?: Transaction) {
    return parseData(ticketNumInfoSchema, ref.ticketNumInfo(shopId), undefined, transaction)
}

export async function updateLastTicketNum(ref: DBRefs, ticket: Ticket,transaction?:Transaction) {
    return updateEntireData(ticketNumInfoSchema.omit({ticketNumConfig: true}), ref.ticketNumInfo(ticket.shopId), {lastTicketNum: ticket.ticketNum},transaction)
}

export async function generateNextTicketNum(ref: DBRefs, shopId: string, uid: string, transaction?: Transaction): Promise<Success & {
    nextTicketNum: string
}> {
    let suggested: string | undefined = undefined
    const info = await ticketNumInfoById(ref, shopId, transaction)
    if (info) {
        const next = nextTicketNum(info)
        if (next.isSuccess) {
            suggested = next.suggestingNextTicketNum
        }
    }
    if (!suggested) {
        suggested = fallBackTicketNumGenerate(ref, uid).suggestingNextTicketNum
    }

    async function loop(suggestedNextTicket: string): Promise<string> {
        // TODO これ、違う
        const ticket = await ticketById(ref, uid, suggestedNextTicket, transaction)
        if (ticket) {
            return loop(fallBackTicketNumGenerate(ref, uid).suggestingNextTicketNum)
        }
        return suggestedNextTicket
    }

    const suc: Success & { nextTicketNum: string } = {
        isSuccess: true,
        nextTicketNum: await loop(suggested)
    }

    return suc
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

/**
 * [nextTicketNum]にぶん投げられない時のFallBack実装
 * @param ref
 * @param uid
 */
function fallBackTicketNumGenerate(ref: DBRefs, uid: string): Success & {
    suggestingNextTicketNum: string
} {
    error("TicketNumInfo NotFound! FallBack to Random String")
    // generate random capital chars consisted of "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const randomString = Math.random().toString(36).replace(".", "").substring(4)
    const suc: Success & { suggestingNextTicketNum: string } = {
        isSuccess: true,
        suggestingNextTicketNum: randomString
    }

    return suc
}

