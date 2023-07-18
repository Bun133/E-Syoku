import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, newRandomRef, parseData, parseDataAll, updateEntireData} from "../utils/db";
import {UniqueId} from "../types/types";
import {Error, Result, Success} from "../types/errors";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";
import {failedToGetItemDataError, injectError, ticketNotFoundError, ticketStatusInvalidError} from "./errors";
import {Order, SingleOrder} from "../types/order";
import {Timestamp} from "firebase-admin/firestore";
import {generateNextTicketNum, updateLastTicketNum} from "./ticketNumInfos";
import {updateTicketDisplayDataForTicket} from "./ticketDisplays";
import DocumentReference = firestore.DocumentReference;
import Transaction = firestore.Transaction;

/**
 * Should not be called directly.
 * @param ref
 * @param uid
 * @param ticketId
 */
export async function ticketById(ref: DBRefs, uid: string, ticketId: string): Promise<Ticket | undefined> {
    return ticketByRef(ref, uid, ref.tickets(uid).doc(ticketId));
}

/**
 * Should not be called directly.
 * @param ref
 * @param uid
 * @param ticketRef
 */
export async function ticketByRef(ref: DBRefs, uid: string, ticketRef: DocumentReference<firestore.DocumentData>): Promise<Ticket | undefined> {
    return await parseData(ticketSchema, ticketRef, (data) => {
        return {
            uniqueId: ticketRef.id,
            customerId: uid,
            ...data
        }
    });
}

/**
 * List tickets for the user
 * @param ref
 * @param uid
 */
export async function listTicketForUser(ref: DBRefs, uid: string): Promise<Array<Ticket>> {
    return parseDataAll(ticketSchema,ref.tickets(uid), (doc, data) => {
        return {
            uniqueId: doc.id,
            customerId: uid,
            ...data
        }
    })
}

/**
 * チケットのステータスを更新
 * @param ref
 * @param uid
 * @param ticketId
 * @param fromStatus
 * @param toStatus
 * @param transaction
 */
export async function updateTicketStatus(ref: DBRefs, uid: string, ticketId: string, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction): Promise<Result> {
    const ticketRef = ref.tickets(uid).doc(ticketId)
    const ticket = await ticketByRef(ref, uid, ticketRef)
    if (!ticket) {
        const err: Error = {
            isSuccess: false,
            ...injectError(ticketNotFoundError)
        }
        return err
    }
    if (ticket.status === toStatus) {
        const err: Error = {
            "isSuccess": false,
            ...injectError(ticketStatusInvalidError(fromStatus, ticket.status))
        }
        return err
    }

    const toWriteTicket: Ticket = {
        ...ticket,
        status: toStatus
    }

    let writeResult: Result = {
        isSuccess: true
    }

    if (transaction) {
        await transaction.update(ticketRef, {
            status: toStatus
        })
    } else {
        writeResult = await updateEntireData(ticketSchema, ticketRef, toWriteTicket)
    }

    if (writeResult.isSuccess) {
        await updateTicketDisplayDataForTicket(ref, toWriteTicket)
        const suc: Success = {
            isSuccess: true,
        }
        return suc
    } else {
        return writeResult
    }
}

/**
 * 決済セッションのデータから食券を発行します
 * ***支払いが完了したかどうかは確認しません***
 * ***店舗ごとに発行されます***
 * @param ref
 * @param uid
 * @param payment
 */
export async function registerTicketsForPayment(ref: DBRefs, uid: string, payment: PaymentSession): Promise<Error | (Success & {
    ticketsId: string[]
})> {
    // Get ItemData
    const orderWithShopData = (await Promise.all(payment.orderContent.map(async (e) => {
        const itemData = await getGoodsById(ref, e.goodsId)
        if (itemData === undefined) {
            return undefined
        }
        return {
            ...e,
            itemData: itemData
        }
    }))).filterNotNullStrict()
    if (orderWithShopData === undefined) {
        const err: Error = {
            isSuccess: false,
            ...injectError(failedToGetItemDataError)
        }
        return err
    }

    // 店舗ごとに振り分け
    const shopMap: Map<UniqueId, SingleOrder[]> = new Map()
    for (const order of orderWithShopData) {
        if (shopMap.has(order.itemData.shopId)) {
            shopMap.get(order.itemData.shopId)!.push(order)
        } else {
            shopMap.set(order.itemData.shopId, [order])
        }
    }

    // 食券書き込み
    const writtenTicketIds: string[] = []

    let shopId: string
    let order: Order
    // 店舗ごとに分けたOrderから食券登録
    for ([shopId, order] of shopMap.toArray()) {
        const toWriteRef = await newRandomRef(ref.tickets(uid))
        const nextTicketNum = await generateNextTicketNum(ref, shopId, uid)

        const ticketData: Ticket = {
            uniqueId: toWriteRef.id,
            customerId: uid,
            shopId: shopId,
            orderData: order,
            status: "PROCESSING",
            issueTime: Timestamp.now(),
            paymentSessionId: payment.sessionId,
            ticketNum: nextTicketNum.nextTicketNum
        }

        await toWriteRef.set(ticketData)
        writtenTicketIds.push(toWriteRef.id)
        await updateLastTicketNum(ref, ticketData)
        await updateTicketDisplayDataForTicket(ref, ticketData)
    }

    const suc: Success & { ticketsId: string[] } = {
        isSuccess: true,
        ticketsId: writtenTicketIds
    }

    return suc
}