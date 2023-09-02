import {
    createData,
    DBRefs,
    newRandomBarcode,
    newRandomRef,
    parseData,
    parseQueryDataAll,
    updateEntireData
} from "../utils/db";
import {Order} from "../types/order";
import {AuthInstance} from "../types/auth";
import {PaidDetail, PaymentSession, paymentSessionSchema} from "../types/payment";
import {cancelReserveGoods, getGoodsById, reserveGoods} from "./goods";
import {firestore} from "firebase-admin";
import {Error, SingleError, Success, TypedSingleResult} from "../types/errors";
import {
    alreadyPaidError,
    calculateTotalAmountFailed,
    dbNotFoundError,
    errorResult,
    injectError,
    isError,
    isSingleError,
    isTypedSuccess,
    paidWrongAmountError,
    paymentCreateFailedError,
    paymentStatusNotSatisfiedError
} from "./errors";
import {deleteTickets, registerTicketsForPayment} from "./ticket";
import {error} from "../utils/logger";
import {Timestamp} from "firebase-admin/firestore";
import DocumentReference = firestore.DocumentReference;

/**
 * 実際に決済セッションを作成し、DBに登録
 * ***商品の在庫を確認しません***
 * @param ref
 * @param customer
 * @param order
 */
export async function internalCreatePaymentSession(ref: DBRefs, customer: AuthInstance, order: Order): Promise<Success & {
    paymentSessionId: string
} | Error> {
    // 実際に決済セッションを作成するRef
    const paymentSessionRef = await newRandomRef(ref.payments)
    const barcode = await newRandomBarcode(ref.payments, 6)

    // 合計金額を計算
    const totalAmount = await calculateTotalAmount(ref, order)
    if (isError(totalAmount)) {
        return totalAmount
    }

    // 決済セッションのデータ
    const paymentSession: PaymentSession = {
        customerId: customer.uid,
        orderContent: order,
        sessionId: paymentSessionRef.id,
        state: "UNPAID",
        totalAmount: totalAmount.totalAmount!,
        barcode: barcode,
        paymentCreatedTime: Timestamp.now()
    }

    // DBに決済セッションのデータを保存
    const setRes = await createData(paymentSessionSchema.omit({sessionId: true}), paymentSessionRef, {
        customerId: paymentSession.customerId,
        orderContent: paymentSession.orderContent,
        state: paymentSession.state,
        totalAmount: paymentSession.totalAmount,
        barcode: barcode,
        paymentCreatedTime: paymentSession.paymentCreatedTime
    })
    if (isSingleError(setRes)) {
        // 決済セッションのデータを保存できなかった
        // 実害がないのでロールバックしない
        return errorResult({
            isSuccess: false,
            ...injectError(paymentCreateFailedError)
        }, setRes)
    }

    const suc: Success & {
        paymentSessionId: string
    } = {
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
async function calculateTotalAmount(ref: DBRefs, order: Order): Promise<Success & {
    totalAmount: number
} | Error> {
    const amounts: TypedSingleResult<number>[] = (await Promise.all(
            order.map(async (o) => {
                // 商品データを取得
                const data = await getGoodsById(ref, o.goodsId)
                if (isSingleError(data)) return data
                return {
                    isSuccess: true,
                    data: data.data.price * o.count
                }
            }))
    )

    const failedAmounts = amounts.filter(isSingleError)
    const successAmounts = amounts.filter(isTypedSuccess)

    // 一部の商品の商品データを取得出来なかった
    if (failedAmounts.length > 0) {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(calculateTotalAmountFailed)
        }
        return errorResult(err, ...failedAmounts)
    }

    // 全部足して合計金額を求める
    const totalAmount = successAmounts.reduce((a, b) => a + b.data, 0)

    const suc: Success & {
        totalAmount: number
    } = {
        isSuccess: true,
        totalAmount: totalAmount
    }
    return suc
}

export async function getPaymentSessionById(ref: DBRefs, paymentSessionId: string): Promise<TypedSingleResult<PaymentSession>> {
    return getPaymentSessionByRef(ref, ref.payments.doc(paymentSessionId))
}

export function transformPaymentSession(sessionId: string, data: firestore.DocumentData): PaymentSession {
    return {
        sessionId: sessionId,
        customerId: data.customerId,
        orderContent: data.orderContent,
        boundTicketId: data.boundTicketId,
        state: data.state,
        totalAmount: data.totalAmount,
        barcode: data.barcode,
        paymentCreatedTime: data.paymentCreatedTime,
    }
}

export async function getPaymentSessionByRef(ref: DBRefs, paymentRef: DocumentReference): Promise<TypedSingleResult<PaymentSession>> {
    return parseData<PaymentSession>(dbNotFoundError("paymentSession"), paymentSessionSchema, paymentRef, (data) => transformPaymentSession(paymentRef.id, data))
}

export async function getPaymentSessionByBarcode(ref: DBRefs, barcode: string): Promise<PaymentSession> {
    return (await parseQueryDataAll<PaymentSession>(paymentSessionSchema, ref.payments.where("barcode", "==", barcode), (doc, data) => transformPaymentSession(doc.id, data)))[0]
}

export async function getAllPayments(ref: DBRefs, userid: string): Promise<PaymentSession[]> {
    return await parseQueryDataAll<PaymentSession>(paymentSessionSchema, ref.payments.where("customerId", "==", userid), (doc, data) => transformPaymentSession(doc.id, data))
}

/**
 * 決済セッションのステータスをPAIDに変更します
 * ***商品の在庫を確認します***
 * ***決済金額が決済セッションの合計金額と合致するか確認します***
 * ***決済セッションがすでにPAIDになっていないか確認します***
 * ***決済セッションが存在することを確認します***
 * ***商品の在庫を減らします***
 * @param refs
 * @param sessionId
 * @param paidDetail
 */
export async function markPaymentAsPaid(refs: DBRefs, sessionId: string, paidDetail: PaidDetail): Promise<Error | Success & {
    ticketsId: string[]
}> {
    return await internalMarkPaymentAsPaid(refs, sessionId, paidDetail)
}

async function internalMarkPaymentAsPaid(refs: DBRefs, sessionId: string, paidDetail: PaidDetail): Promise<Error | Success & {
    ticketsId: string[]
}> {
    const assert = await assertPaymentStatus(refs, sessionId, paidDetail)
    if (isSingleError(assert)) {
        // 前提条件を満たしていない
        return errorResult({
            isSuccess: false,
            ...injectError(paymentStatusNotSatisfiedError)
        }, assert)
    }

    const {payment, paymentRef} = assert


    // 商品の在庫を確保(在庫状況をを減らして更新)
    const reserveRes = await reserveGoods(refs, payment.orderContent)

    async function rollBackReserveGoods() {
        error("in internalMarkPaymentAsPaid,rollBacking Goods Reservation")
        await cancelReserveGoods(refs, reserveRes.reserved)
    }

    if (isError(reserveRes)) {
        // エラー内容はそのままパスでいいが、ロールバック処理を行う
        const err: Error = reserveRes
        await rollBackReserveGoods()
        return err
    }

    // 決済セッションのデータからチケットを登録
    const ticketRes = await registerTicketsForPayment(refs, payment)

    async function rollBackTickets() {
        error("in internalMarkPaymentAsPaid,rollBacking Tickets Registration")
        await deleteTickets(refs, ticketRes.registered.ticketIds)
    }

    if (isError(ticketRes)) {
        // エラー内容はそのままパスでいいが、ロールバック処理を行う
        const err: Error = ticketRes
        await rollBackReserveGoods()
        await rollBackTickets()
        return err
    }

    // 決済セッションのステータスを支払い済みに変更
    // 決済セッションのデータにboundTicketIdを追加
    const update = await updateEntireData(paymentSessionSchema.omit({
        sessionId: true,
        customerId: true,
        orderContent: true,
        totalAmount: true,
        barcode: true,
        paymentCreatedTime: true,
    }), paymentRef, {
        state: "PAID",
        paidDetail: paidDetail,
        boundTicketId: ticketRes.registered.ticketIds
    })
    if (isSingleError(update)) {
        const err: SingleError = update
        await rollBackReserveGoods()
        await rollBackTickets()
        return errorResult(err)
    }

    const suc: Success & {
        ticketsId: string[]
    } = {
        isSuccess: true,
        ticketsId: ticketRes.registered.ticketIds
    }

    return suc
}

/**
 * 決済取扱いにおいて、満たしていなければいけない前庭条件をassertします
 */
async function assertPaymentStatus(refs: DBRefs, sessionId: string, paidDetail: PaidDetail): Promise<SingleError | Success & {
    payment: PaymentSession,
    paymentRef: DocumentReference
}> {
    // 決済セッションのRef・データ
    const paymentRef = refs.payments.doc(sessionId)
    const payment = await getPaymentSessionByRef(refs, paymentRef)

    if (isSingleError(payment)) {
        // 決済セッションのデータが見つからなかった
        return payment
    }

    // 決済セッションのデータのステータスが"PAID"になっている
    if (payment.data.state === "PAID") {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(alreadyPaidError)
        }
        return err
    }

    // 決済済みの金額が決済セッションの合計金額と合致することを確認
    if (payment.data.totalAmount !== paidDetail.paidAmount) {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(paidWrongAmountError)
        }
        return err
    }

    const suc: Success & {
        payment: PaymentSession,
        paymentRef: DocumentReference
    } = {
        isSuccess: true,
        payment: payment.data,
        paymentRef
    }

    return suc
}