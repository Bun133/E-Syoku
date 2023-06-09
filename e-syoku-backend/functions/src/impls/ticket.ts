import {Ticket, ticketSchema} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, newRandomRef, parseData, updateData} from "../utils/db";
import {UniqueId} from "../types/types";
import {Error, Success} from "../types/errors";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";
import {failedToGetItemDataError, injectError} from "./errors";
import {Order, SingleOrder} from "../types/order";
import DocumentReference = firestore.DocumentReference;
import {Timestamp} from "firebase-admin/firestore";

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
    const ticketsCollectionRef = ref.tickets(uid)
    const ticketsSnapshot = await ticketsCollectionRef.listDocuments();
    return (await Promise.all(ticketsSnapshot.map(ticketRef => ticketByRef(ref, uid, ticketRef)))).filterNotNull();
}

/**
 * This function should not be called directly.
 * @param ref
 * @param uid
 * @param ticketId
 * @param data
 */
export async function updateTicketById(ref: DBRefs, uid: string, ticketId: string, data: Partial<Ticket>): Promise<boolean> {
    return updateTicketByRef(ref, ref.tickets(uid).doc(ticketId), data);
}

/**
 * This function should not be called directly.
 * @param ref
 * @param ticketRef
 * @param data
 */
export async function updateTicketByRef(ref: DBRefs, ticketRef: DocumentReference<firestore.DocumentData>, data: Partial<Ticket>): Promise<boolean> {
    return await updateData(ticketRef, data)
}

/**
 * 食券を発行する時に、食券の表示名を生成する関数
 * @param shopId
 */
async function generateTicketNum(shopId: UniqueId): Promise<string> {
    return "T-1"
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
    for ([shopId, order] of shopMap.toArray()) {
        const toWriteRef = await newRandomRef(ref.tickets(uid))
        const ticketData: Ticket = {
            uniqueId: toWriteRef.id,
            customerId: uid,
            shopId: shopId,
            orderData: order,
            status: "PROCESSING",
            issueTime: Timestamp.now(),
            paymentSessionId: payment.sessionId,
            ticketNum: await generateTicketNum(shopId)
        }

        await toWriteRef.set(ticketData)
        writtenTicketIds.push(toWriteRef.id)
    }

    const suc: Success & { ticketsId: string[] } = {
        isSuccess: true,
        ticketsId: writtenTicketIds
    }

    return suc
}