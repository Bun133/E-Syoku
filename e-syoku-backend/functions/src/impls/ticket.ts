import {Ticket, ticketSchema, TicketStatus} from "../types/ticket";
import {firestore} from "firebase-admin";
import {createData, DBRefs, mergeData, newRandomRef, parseData, parseDataAll} from "../utils/db";
import {UniqueId} from "../types/types";
import {Error, Result, Success} from "../types/errors";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";
import {
    barcodeInvalidError,
    failedToGetItemDataError,
    injectError,
    ticketNotFoundError,
    ticketStatusInvalidError
} from "./errors";
import {Order, SingleOrder} from "../types/order";
import {Timestamp} from "firebase-admin/firestore";
import {generateNextTicketNum, updateLastTicketNum} from "./ticketNumInfos";
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
export async function ticketById(ref: DBRefs, uid: string, ticketId: string,transaction?:Transaction): Promise<Ticket | undefined> {
    return ticketByRef(ref, uid, ref.tickets(uid).doc(ticketId),transaction);
}

/**
 * チケットデータをFirestoreのDocumentReferenceから取得します
 * @param ref
 * @param uid
 * @param ticketRef
 */
export async function ticketByRef(ref: DBRefs, uid: string, ticketRef: DocumentReference<firestore.DocumentData>,transaction?:Transaction): Promise<Ticket | undefined> {
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
    },transaction);
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
 * @param transaction
 */
export async function registerTicketsForPayment(ref: DBRefs, uid: string, payment: PaymentSession,transaction?:Transaction): Promise<Error | (Success & {
    ticketsId: string[]
})> {
    // 商品データを取得
    const orderWithShopData = (await Promise.all(payment.orderContent.map(async (e) => {
        const itemData = await getGoodsById(ref, e.goodsId,transaction)
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
        const rawOrder:SingleOrder = {
            goodsId: order.goodsId,
            count: order.count
        }
        if (shopMap.has(order.itemData.shopId)) {
            shopMap.get(order.itemData.shopId)!.push(rawOrder)
        } else {
            shopMap.set(order.itemData.shopId, [rawOrder])
        }
    }

    // 書き込み済のチケットのID
    const writtenTicketIds: string[] = []

    let shopId: string
    let order: Order
    // 店舗ごとに分けたOrderから食券登録
    for ([shopId, order] of shopMap.toArray()) {
        // ランダムに新しいRefを取得してチケットを登録
        const toWriteRef = await newRandomRef(ref.tickets(uid),transaction)
        // この食券のTicketNumを取得
        const nextTicketNum = await generateNextTicketNum(ref, shopId, uid,transaction)

        // チケットデータを生成
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

        // チケットデータを書き込み
        await createData(ticketSchema, toWriteRef, ticketData,transaction)
        writtenTicketIds.push(toWriteRef.id)
        // LastTicketNumを更新
        await updateLastTicketNum(ref, ticketData,transaction)
        // TicketDisplayDataを更新
        await updateTicketDisplayDataForTicket(ref, ticketData,transaction)
    }

    const suc: Success & { ticketsId: string[] } = {
        isSuccess: true,
        ticketsId: writtenTicketIds
    }

    return suc
}