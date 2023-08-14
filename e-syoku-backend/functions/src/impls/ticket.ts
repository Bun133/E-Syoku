import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, mergeData, parseData, parseQueryDataAll} from "../utils/db";
import {UniqueId} from "../types/types";
import {Error, Result, Success, TypedSingleResult} from "../types/errors";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";
import {
    dbNotFoundError,
    failedToGetItemDataError,
    failedToRegisterTicketError,
    injectError,
    ticketStatusInvalidError
} from "./errors";
import {Order, SingleOrder} from "../types/order";
import {Timestamp} from "firebase-admin/firestore";
import {createNewTicket} from "./ticketNumInfos";
import {getTicketBarcodeBindData} from "./barcode";
import {NotificationData, sendMessage} from "./notification";
import {Messaging} from "firebase-admin/lib/messaging";
import DocumentReference = firestore.DocumentReference;
import Transaction = firestore.Transaction;

function ticketParser(uniqueId: string, data: firestore.DocumentData): Ticket {
    return {
        uniqueId: uniqueId,
        ticketNum: data.ticketNum,
        shopId: data.shopId,
        customerId: data.customerId,
        issueTime: data.issueTime,
        status: data.status,
        lastStatusUpdated: data.lastStatusUpdated,
        paymentSessionId: data.paymentSessionId,
        orderData: data.orderData,
        goodsIds: data.goodsIds
    }
}

/**
 * チケットデータを[uid]と[ticketId]から取得します
 * @param ref
 * @param ticketId
 * @param transaction
 */
export async function ticketById(ref: DBRefs, ticketId: string, transaction?: Transaction): Promise<TypedSingleResult<Ticket>> {
    return ticketByRef(ref, ref.tickets.doc(ticketId), transaction);
}

/**
 * チケットデータをFirestoreのDocumentReferenceから取得します
 * @param ref
 * @param ticketRef
 * @param transaction
 */
export async function ticketByRef(ref: DBRefs, ticketRef: DocumentReference<firestore.DocumentData>, transaction?: Transaction): Promise<TypedSingleResult<Ticket>> {
    return await parseData<Ticket>(dbNotFoundError("ticket"), ticketSchema, ticketRef, (data) => ticketParser(ticketRef.id, data), transaction);
}

export async function getTickets(ref: DBRefs, ticketIds: string[]) {
    return await parseQueryDataAll<Ticket>(ticketSchema, ref.tickets.where("uniqueId", "in", ticketIds), (ref, data) => ticketParser(ref.id, data))
}

/**
 * List tickets for the user
 * @param ref
 * @param uid
 */
export async function listTicketForUser(ref: DBRefs, uid: string): Promise<Array<Ticket>> {
    return await parseQueryDataAll<Ticket>(ticketSchema, ref.tickets.where("customerId", "==", uid), (ref, data) => ticketParser(ref.id, data))
}

export async function listTicketForShop(ref: DBRefs, shopId: string): Promise<Array<Ticket>> {
    return await parseQueryDataAll<Ticket>(ticketSchema, ref.tickets.where("shopId", "==", shopId), (ref, data) => ticketParser(ref.id, data))
}

/**
 * チケットのステータスをバーコードの情報から食券データを特定し更新します
 * @param ref
 * @param messaging
 * @param barcode
 * @param fromStatus
 * @param toStatus
 * @param transaction
 */
export async function updateTicketStatusByBarcode(ref: DBRefs, messaging: Messaging, barcode: string, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction): Promise<Result> {
    const barcodeData = await getTicketBarcodeBindData(ref, barcode)
    if (!barcodeData.isSuccess) {
        const err: Error = barcodeData
        return err
    }

    return await updateTicketStatusByIds(ref, messaging, barcodeData.data.ticketId, fromStatus, toStatus, transaction)
}

export async function updateTicketStatusByIds(ref: DBRefs, messaging: Messaging, ticketId: string, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction, sendNotification?: NotificationData): Promise<Success & {
    targetTicket: Ticket
} | Error> {
    return await internalUpdateTicketStatus(ref, messaging, ref.tickets.doc(ticketId), fromStatus, toStatus, transaction, sendNotification)
}

/**
 * チケットのステータスを[fromStatus]から[toStatus]に変更します
 * @param ref
 * @param messaging
 * @param ticketRef
 * @param fromStatus
 * @param toStatus
 * @param transaction
 * @param sendNotification
 */
async function internalUpdateTicketStatus(ref: DBRefs, messaging: Messaging, ticketRef: DocumentReference, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction, sendNotification?: NotificationData)
    : Promise<Success & { targetTicket: Ticket } | Error> {

    // チケットの存在を確認する
    const ticket = await ticketByRef(ref, ticketRef)
    if (!ticket.isSuccess) {
        const err: Error = ticket
        return err
    }

    if (ticket.data.status !== fromStatus) {
        // チケットのステータスが変更前のステータスではないのでエラー
        const err: Error = {
            "isSuccess": false,
            ...injectError(ticketStatusInvalidError(fromStatus, ticket.data.status))
        }
        return err
    }

    // チケットのデータをもとに、DBを更新
    let writeResult: Result = await mergeData(ticketSchema.omit({
        ticketNum: true,
        customerId: true,
        issueTime: true,
        orderData: true,
        goodsIds: true,
        paymentSessionId: true,
        shopId: true,
        uniqueId: true
    }), ticketRef, {status: toStatus, lastStatusUpdated: Timestamp.now()}, transaction)

    if (writeResult.isSuccess) {
        // 通知を送信する場合は送信処理を行います
        if (sendNotification) {
            await sendMessage(ref, messaging, ticket.data.customerId, sendNotification)
        }
        const suc: Success & { targetTicket: Ticket } = {
            isSuccess: true,
            targetTicket: ticket.data
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
 * @param payment
 */
export async function registerTicketsForPayment(ref: DBRefs, payment: PaymentSession): Promise<Error & {
    registered: {
        ticketIds: string[]
    }
} | (Success & {
    registered: {
        // All Ticket IDs
        ticketIds: string[]
    }
})> {
    // 店舗ごとにバラす
    const associated = await associatedWithShop(ref, payment)
    if (!associated.isSuccess) {
        const err: Error & {
            registered: {
                ticketIds: string[]
            }
        } = {
            ...associated,
            registered: {ticketIds: []}
        }
        return err
    }
    const shopMap = associated.shopMap


    // 書き込み済のチケット
    const registered: string[] = []
    const notRegistered: {
        shopId: string,
        order: Order
    }[] = []

    let shopId: string
    let order: Order
    // 店舗ごとに分けたOrderから食券登録
    for ([shopId, order] of shopMap.toArray()) {
        const r = await registerTicket(ref, payment.customerId, shopId, order, payment)
        if (r.isSuccess) {
            registered.push(r.ticketId)
        } else {
            notRegistered.push({shopId: shopId, order: order})
        }
    }

    if (notRegistered.length > 0) {
        const err: Error & {
            registered: {
                ticketIds: string[]
            }
        } = {
            isSuccess: false,
            registered: {ticketIds: registered},
            ...injectError(failedToRegisterTicketError)
        }

        return err
    }

    const suc: Success & {
        registered: {
            ticketIds: string[]
        }
    } = {
        isSuccess: true,
        registered: {ticketIds: registered}
    }

    return suc
}

/**
 * 単一のお店の注文データから食券を登録します
 * @param ref
 * @param uid
 * @param shopId
 * @param order
 * @param associatedPayment
 */
async function registerTicket(ref: DBRefs, uid: string, shopId: string, order: Order, associatedPayment: PaymentSession): Promise<Success & {
    ticketId: string
} | Error> {
    const newTicket = await createNewTicket(ref, shopId, (ticketId: string, ticketNum: string) => {
        const ticketData: Ticket = {
            uniqueId: ticketId,
            customerId: uid,
            shopId: shopId,
            orderData: order,
            goodsIds: order.map((e) => e.goodsId),
            status: "PROCESSING",
            lastStatusUpdated: Timestamp.now(),
            issueTime: Timestamp.now(),
            paymentSessionId: associatedPayment.sessionId,
            ticketNum: ticketNum
        }
        return ticketData
    })

    if (!newTicket.isSuccess) {
        const err: Error = newTicket
        return err
    }

    const suc: Success & {
        ticketId: string
    } = {
        isSuccess: true,
        ticketId: newTicket.ticket.uniqueId
    }

    return suc
}

/**
 * 食券を削除します(ロールバック用)
 * @param ref
 * @param ticketIds
 */
export async function deleteTickets(ref: DBRefs, ticketIds: string[]) {
    return await Promise.all(ticketIds.map(async (id) => {
        await (ref.tickets.doc(id).delete())
    }))
}

async function associatedWithShop(ref: DBRefs, payment: PaymentSession): Promise<Error | Success & {
    shopMap: Map<UniqueId, SingleOrder[]>
}> {
    // 商品データを取得
    const orderWithShopData = (await Promise.all(payment.orderContent.map(async (e) => {
        const itemData = await getGoodsById(ref, e.goodsId)
        if (!itemData.isSuccess) {
            return undefined
        }
        return {
            ...e,
            itemData: itemData.data
        }
    }))).filterNotNullStrict()
    if (orderWithShopData === undefined) {
        // 一つでも商品データを取得できなかった場合はエラーに
        const err: Error = {
            isSuccess: false,
            ...injectError(failedToGetItemDataError)
        }
        return err
    }

    // 店舗ごとに振り分け
    const shopMap: Map<UniqueId, SingleOrder[]> = new Map()
    for (const order of orderWithShopData) {
        const rawOrder: SingleOrder = {
            goodsId: order.goodsId,
            count: order.count
        }
        if (shopMap.has(order.itemData.shopId)) {
            shopMap.get(order.itemData.shopId)!.push(rawOrder)
        } else {
            shopMap.set(order.itemData.shopId, [rawOrder])
        }
    }

    const suc: Success & {
        shopMap: Map<UniqueId, SingleOrder[]>
    } = {
        isSuccess: true,
        shopMap: shopMap
    }

    return suc
}

/**
 * 指定された店舗に対して、指定された人数が呼ばれている状態にする関数
 *
 * なんか失敗しても、無視します。(呼べない分にはセーフ)
 * @param ref
 * @param messaging
 * @param shopId
 * @param count
 */
export async function callTicketStackFunc(ref: DBRefs, messaging: Messaging, shopId: string, count: number): Promise<Success & {
    calledTicketIds: string[]
}> {
    const ticketData: Ticket[] = (await listTicketForShop(ref, shopId)).sort((a, b) => {
        // TODO nanoSecs
        return a.lastStatusUpdated.seconds - b.lastStatusUpdated.seconds
    })

    let calledTicketCount: number = 0
    ticketData.forEach((e) => {
        if (e.status === "CALLED") {
            calledTicketCount++
        }
    })

    const toCallCount = count - calledTicketCount
    if (toCallCount <= 0) {
        // Do nothing
        const suc: Success & { calledTicketIds: string[] } = {
            isSuccess: true,
            calledTicketIds: []
        }

        return suc
    } else {
        const toCallTicketIds: Ticket[] = []
        const processing = ticketData.filter(e => e.status === "PROCESSING")
        for (let i = 0; i < toCallCount; i++) {
            if (i < processing.length) {
                toCallTicketIds.push(processing[i])
            }
        }

        const res = await Promise.all(toCallTicketIds.map(async e => {
            const result = await updateTicketStatusByIds(ref, messaging, e.uniqueId, "PROCESSING", "CALLED")
            return {
                ticketId: e.uniqueId,
                result: result
            }
        }))


        const success = res.filter(r => r.result.isSuccess)

        const suc: Success & { calledTicketIds: string[] } = {
            isSuccess: true,
            calledTicketIds: success.map(e => e.ticketId)
        }
        return suc
    }
}