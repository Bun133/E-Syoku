import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {DBRefs, mergeData, parseData, parseDataAll} from "../utils/db";
import {UniqueId} from "../types/types";
import {Error, Result, Success} from "../types/errors";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";
import {
    barcodeInvalidError,
    failedToGetItemDataError,
    failedToRegisterTicketError,
    injectError,
    ticketNotFoundError,
    ticketStatusInvalidError
} from "./errors";
import {Order, SingleOrder} from "../types/order";
import {Timestamp} from "firebase-admin/firestore";
import {createNewTicket} from "./ticketNumInfos";
import {updateTicketDisplayDataForTicket} from "./ticketDisplays";
import {getBarcodeBindData} from "./barcode";
import DocumentReference = firestore.DocumentReference;
import Transaction = firestore.Transaction;

/**
 * チケットデータを[uid]と[ticketId]から取得します
 * @param ref
 * @param uid
 * @param ticketId
 * @param transaction
 */
export async function ticketById(ref: DBRefs, uid: string, ticketId: string, transaction?: Transaction): Promise<Ticket | undefined> {
    return ticketByRef(ref, uid, ref.tickets(uid).doc(ticketId), transaction);
}

/**
 * チケットデータをFirestoreのDocumentReferenceから取得します
 * @param ref
 * @param uid
 * @param ticketRef
 */
export async function ticketByRef(ref: DBRefs, uid: string, ticketRef: DocumentReference<firestore.DocumentData>, transaction?: Transaction): Promise<Ticket | undefined> {
    return await parseData<Ticket>(ticketSchema, ticketRef, (data) => {
        return {
            uniqueId: ticketRef.id,
            ticketNum: data.ticketNum,
            shopId: data.shopId,
            customerId: uid,
            issueTime: data.issueTime,
            status: data.status,
            paymentSessionId: data.paymentSessionId,
            orderData: data.orderData
        }
    }, transaction);
}

export async function getTickets(ref:DBRefs,uid:string,ticketIds:string[]){
    return await parseDataAll<Ticket>(ticketSchema,ticketIds.map(e => ref.tickets(uid).doc(e)),(ref,data) => {
        return{
            uniqueId: ref.id,
            ticketNum: data.ticketNum,
            shopId: data.shopId,
            customerId: uid,
            issueTime: data.issueTime,
            status: data.status,
            paymentSessionId: data.paymentSessionId,
            orderData: data.orderData
        }
    })
}

/**
 * List tickets for the user
 * @param ref
 * @param uid
 */
export async function listTicketForUser(ref: DBRefs, uid: string): Promise<Array<Ticket>> {
    return parseDataAll<Ticket>(ticketSchema, ref.tickets(uid), (doc, data) => {
        return {
            uniqueId: doc.id,
            ticketNum: data.ticketNum,
            shopId: data.shopId,
            customerId: uid,
            issueTime: data.issueTime,
            status: data.status,
            paymentSessionId: data.paymentSessionId,
            orderData: data.orderData
        }
    })
}

/**
 * チケットのステータスをバーコードの情報から食券データを特定し更新します
 * @param ref
 * @param barcode
 * @param fromStatus
 * @param toStatus
 * @param transaction
 */
export async function updateTicketStatusByBarcode(ref: DBRefs, barcode: string, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction): Promise<Result> {
    const barcodeData = await getBarcodeBindData(ref, barcode)
    if (!barcodeData) {
        const err: Error = {
            isSuccess: false,
            ...injectError(barcodeInvalidError)
        }
        return err
    }

    return await updateTicketStatusByIds(ref, barcodeData.uid, barcodeData.ticketId, fromStatus, toStatus, transaction)
}

export async function updateTicketStatusByIds(ref: DBRefs, uid: string, ticketId: string, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction): Promise<Result> {
    return await internalUpdateTicketStatus(ref, uid, ref.tickets(uid).doc(ticketId), fromStatus, toStatus, transaction)
}

/**
 * チケットのステータスを[fromStatus]から[toStatus]に変更します
 * @param ref
 * @param uid
 * @param ticketRef
 * @param fromStatus
 * @param toStatus
 * @param transaction
 */
export async function internalUpdateTicketStatus(ref: DBRefs, uid: string, ticketRef: DocumentReference, fromStatus: TicketStatus, toStatus: TicketStatus, transaction?: Transaction): Promise<Result> {

    // チケットの存在を確認する
    const ticket = await ticketByRef(ref, uid, ticketRef)
    if (!ticket) {
        const err: Error = {
            isSuccess: false,
            ...injectError(ticketNotFoundError)
        }
        return err
    }

    if (ticket.status !== fromStatus) {
        // チケットのステータスが変更前のステータスではないのでエラー
        const err: Error = {
            "isSuccess": false,
            ...injectError(ticketStatusInvalidError(fromStatus, ticket.status))
        }
        return err
    }

    // 変更後のチケットのデータ
    const toWriteTicket: Ticket = {
        ...ticket,
        status: toStatus
    }

    // チケットのデータをもとに、DBを更新
    let writeResult: Result = await mergeData(ticketSchema.omit({
        ticketNum: true,
        customerId: true,
        issueTime: true,
        orderData: true,
        paymentSessionId: true,
        shopId: true,
        uniqueId: true
    }), ticketRef, {status: toStatus}, transaction)

    if (writeResult.isSuccess) {
        // チケットのDisplayDataも変更
        // TODO エラーハンドリングをどうするのか
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
export async function registerTicketsForPayment(ref: DBRefs, uid: string, payment: PaymentSession): Promise<Error & {
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
        const r = await registerTicket(ref, uid, shopId, order, payment)
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
    const newTicket = await createNewTicket(ref, shopId, uid, (ticketId: string, ticketNum: string) => {
        const ticketData: Ticket = {
            uniqueId: ticketId,
            customerId: uid,
            shopId: shopId,
            orderData: order,
            status: "PROCESSING",
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
 * @param uid
 * @param ticketIds
 */
export async function deleteTickets(ref: DBRefs, uid: string, ticketIds: string[]) {
    return await Promise.all(ticketIds.map(async (id) => {
        await (ref.tickets(uid).doc(id).delete())
    }))
}

async function associatedWithShop(ref: DBRefs, payment: PaymentSession): Promise<Error | Success & {
    shopMap: Map<UniqueId, SingleOrder[]>
}> {
    // 商品データを取得
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