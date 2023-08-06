import {createData, DBRefs, newRandomRef, parseData, parseDataAll, updateEntireData} from "../utils/db";
import {Order} from "../types/order";
import {AuthInstance} from "../types/auth";
import {PaidDetail, PaymentSession, paymentSessionSchema} from "../types/payment";
import {cancelReserveGoods, getGoodsById, reserveGoods} from "./goods";
import {firestore} from "firebase-admin";
import {Error, Success, TypedSingleResult} from "../types/errors";
import {alreadyPaidError, calculateTotalAmountFailed, injectError, paidWrongAmountError} from "./errors";
import {deleteTickets, registerTicketsForPayment} from "./ticket";
import {error} from "../utils/logger";
import DocumentReference = firestore.DocumentReference;

/**
 * 実際に決済セッションを作成し、DBに登録
 * ***商品の在庫を確認しません***
 * @param ref
 * @param customer
 * @param order
 */
export async function internalCreatePaymentSession(ref: DBRefs, customer: AuthInstance, order: Order) {
    // 実際に決済セッションを作成するRef
    const paymentSessionRef = await newRandomRef(ref.payments(customer.uid))

    // 合計金額を計算
    const totalAmount = await calculateTotalAmount(ref, order)
    if (!totalAmount.isSuccess) {
        const err: Error = totalAmount
        return err
    }

    // 決済セッションのデータ
    const paymentSession: PaymentSession = {
        customerId: customer.uid,
        orderContent: order,
        sessionId: paymentSessionRef.id,
        state: "UNPAID",
        totalAmount: totalAmount.totalAmount!
    }

    // DBに決済セッションのデータを保存
    const setRes = await createData(paymentSessionSchema.omit({sessionId: true}), paymentSessionRef, {
        customerId: paymentSession.customerId,
        orderContent: paymentSession.orderContent,
        state: paymentSession.state,
        totalAmount: paymentSession.totalAmount
    })
    if (!setRes.isSuccess) {
        // 決済セッションのデータを保存できなかった
        // 実害がないのでロールバックしない
        const err: Error = setRes
        return err
    }

    const suc: Success & { paymentSessionId: string } = {
        isSuccess: true,
        paymentSessionId: paymentSession.sessionId
    }

    return suc
}

/**
 * [order]の合計金額を計算します
 * @param ref
 * @param order
 */
async function calculateTotalAmount(ref: DBRefs, order: Order) {
    const amounts = (await Promise.all(
            order.map(async (o) => {
                // 商品データを取得
                const data = await getGoodsById(ref, o.goodsId)
                if (!data.isSuccess) return undefined
                return data.data.price * o.count
            }))
    ).filterNotNullStrict({toLog: {message: "in calculateTotalAmount,Failed to get goods data.Operation Terminated"}})

    // 一部の商品の商品データを取得出来なかった
    if (!amounts) {
        const err: Error = {
            isSuccess: false,
            ...injectError(calculateTotalAmountFailed)
        }
        return err
    }

    // 全部足して合計金額を求める
    const totalAmount = amounts.reduce((a, b) => a + b, 0)

    const suc: Success & { totalAmount: number } = {
        isSuccess: true,
        totalAmount: totalAmount
    }
    return suc
}

export async function getPaymentSessionById(ref: DBRefs, userid: string, paymentSessionId: string) {
    return getPaymentSessionByRef(ref, ref.payments(userid).doc(paymentSessionId))
}

export async function getPaymentSessionByRef(ref: DBRefs, paymentRef: DocumentReference): Promise<TypedSingleResult<PaymentSession>> {
    return parseData<PaymentSession>("paymentSession", paymentSessionSchema, paymentRef, (data) => {
        return {
            sessionId: paymentRef.id,
            customerId: data.customerId,
            orderContent: data.orderContent,
            state: data.state,
            totalAmount: data.totalAmount
        }
    })
}

export async function getAllPayments(ref: DBRefs, userid: string): Promise<PaymentSession[]> {
    return await parseDataAll<PaymentSession>("paymentSession", paymentSessionSchema, ref.payments(userid), (doc, data) => {
        return {
            sessionId: doc.id,
            customerId: data.customerId,
            orderContent: data.orderContent,
            state: data.state,
            totalAmount: data.totalAmount
        }
    })
}

/**
 * 決済セッションのステータスをPAIDに変更します
 * ***商品の在庫を確認します***
 * ***決済金額が決済セッションの合計金額と合致するか確認します***
 * ***決済セッションがすでにPAIDになっていないか確認します***
 * ***決済セッションが存在することを確認します***
 * ***商品の在庫を減らします***
 * @param refs
 * @param uid
 * @param sessionId
 * @param paidDetail
 */
export async function markPaymentAsPaid(refs: DBRefs, uid: string, sessionId: string, paidDetail: PaidDetail): Promise<Error | Success & {
    ticketsId: string[]
}> {
    return await internalMarkPaymentAsPaid(refs, uid, sessionId, paidDetail)
}

async function internalMarkPaymentAsPaid(refs: DBRefs, uid: string, sessionId: string, paidDetail: PaidDetail): Promise<Error | Success & {
    ticketsId: string[]
}> {
    const assert = await assertPaymentStatus(refs, uid, sessionId, paidDetail)
    if (!assert.isSuccess) {
        // 前庭条件を満たしていない
        const err: Error = assert
        return err
    }

    const {payment, paymentRef} = assert


    // 商品の在庫を確保(在庫状況をを減らして更新)
    const reserveRes = await reserveGoods(refs, payment.orderContent)

    async function rollBackReserveGoods() {
        error("in internalMarkPaymentAsPaid,rollBacking Goods Reservation")
        await cancelReserveGoods(refs, reserveRes.reserved)
    }

    if (!reserveRes.isSuccess) {
        // エラー内容はそのままパスでいいが、ロールバック処理を行う
        const err: Error = reserveRes
        await rollBackReserveGoods()
        return err
    }

    // 決済セッションのデータからチケットを登録
    const ticketRes = await registerTicketsForPayment(refs, uid, payment)

    async function rollBackTickets() {
        error("in internalMarkPaymentAsPaid,rollBacking Tickets Registration")
        await deleteTickets(refs, uid, ticketRes.registered.ticketIds)
    }

    if (!ticketRes.isSuccess) {
        // エラー内容はそのままパスでいいが、ロールバック処理を行う
        const err: Error = ticketRes
        await rollBackReserveGoods()
        await rollBackTickets()
        return err
    }

    // 決済セッションのステータスを支払い済みに変更
    const update = await updateEntireData(paymentSessionSchema.omit({
        sessionId: true,
        customerId: true,
        orderContent: true,
        totalAmount: true,
    }), paymentRef, {
        state: "PAID",
        paidDetail: paidDetail
    })
    if (!update.isSuccess) {
        const err: Error = update
        await rollBackReserveGoods()
        await rollBackTickets()
        return err
    }

    const suc: Success & { ticketsId: string[] } = {
        isSuccess: true,
        ticketsId: ticketRes.registered.ticketIds
    }

    return suc
}

/**
 * 決済取扱いにおいて、満たしていなければいけない前庭条件をassertします
 */
async function assertPaymentStatus(refs: DBRefs, uid: string, sessionId: string, paidDetail: PaidDetail): Promise<Error | Success & {
    payment: PaymentSession,
    paymentRef: DocumentReference
}> {
    // 決済セッションのRef・データ
    const paymentRef = refs.payments(uid).doc(sessionId)
    const payment = await getPaymentSessionByRef(refs, paymentRef)

    if (!payment.isSuccess) {
        // 決済セッションのデータが見つからなかった
        const err: Error = payment
        return err
    }

    // 決済セッションのデータのステータスが"PAID"になっている
    if (payment.data.state === "PAID") {
        const err: Error = {
            isSuccess: false,
            ...injectError(alreadyPaidError)
        }
        return err
    }

    // 決済済みの金額が決済セッションの合計金額と合致することを確認
    if (payment.data.totalAmount !== paidDetail.paidAmount) {
        const err: Error = {
            isSuccess: false,
            ...injectError(paidWrongAmountError)
        }
        return err
    }

    const suc: Success & { payment: PaymentSession, paymentRef: DocumentReference } = {
        isSuccess: true,
        payment.data,
        paymentRef
    }

    return suc
}