import {createData, DBRefs, newRandomRef, parseData} from "../utils/db";
import {Order} from "../types/order";
import {AuthInstance} from "../types/auth";
import {PaidDetail, PaymentSession, paymentSessionSchema} from "../types/payment";
import {getGoodsById, reserveGoods} from "./goods";
import {firestore} from "firebase-admin";
import {Error, Success} from "../types/errors";
import {
    alreadyPaidError,
    calculateTotalAmountFailed,
    injectError,
    itemGoneError,
    paidWrongAmountError,
    paymentNotFoundError
} from "./errors";
import {checkOrderRemainStatus} from "./order";
import {registerTicketsForPayment} from "./ticket";
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
                if (!data) return undefined
                return data.price * o.count
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

export async function getPaymentSessionByRef(ref: DBRefs, paymentRef: DocumentReference) {
    return parseData<PaymentSession>(paymentSessionSchema, paymentRef, (data) => {
        return {
            sessionId: paymentRef.id,
            customerId: data.customerId,
            orderContent: data.orderContent,
            state: data.state,
            totalAmount: data.totalAmount
        }
    })
}

export async function getAllPayments(ref: DBRefs, userid: string) {
    const docs = await ref.payments(userid).listDocuments()
    return (await Promise.all(docs.map(doc => getPaymentSessionByRef(ref, doc)))).filterNotNullStrict({toLog: {message: "in getAllPayments,Failed to get some payment data."}})
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
    const paymentRef = refs.payments(uid).doc(sessionId)
    const payment = await getPaymentSessionByRef(refs, paymentRef)

    // Check payment exists
    if (!payment) {
        // not found in db
        // Requested for not existing payment
        const err: Error = {
            isSuccess: false,
            ...injectError(paymentNotFoundError)
        }
        return err
    }

    // check state
    if (payment.state === "PAID") {
        // already paid
        const err: Error = {
            isSuccess: false,
            ...injectError(alreadyPaidError)
        }
        return err
    }


    // Check Remain
    const status = await checkOrderRemainStatus(refs, payment.orderContent)
    if (!status.isSuccess) {
        const err: Error = status
        return err
    }
    const {isAllEnough, items} = status
    if (!isAllEnough) {
        const err: Error = {
            isSuccess: false,
            ...injectError(itemGoneError(items.map(i => i.goodsId)))
        }
        return err
    }

    // Check paid amount
    if (payment.totalAmount !== paidDetail.paidAmount) {
        const err: Error = {
            isSuccess: false,
            ...injectError(paidWrongAmountError)
        }
        return err
    }


    // 商品の在庫を確保(在庫状況をを減らして更新)
    // TODO 二回商品の在庫情報を読み取っている
    const reserveRes = await reserveGoods(refs, payment.orderContent)
    if (!reserveRes.isSuccess) {
        const err: Error = reserveRes
        return err
    }

    const ticketRes = await registerTicketsForPayment(refs, uid, payment)
    if (!ticketRes.isSuccess) {
        const err: Error = ticketRes
        return err
    }

    // 決済セッションのステータスを支払い済みに変更
    const updated: PaymentSession = {
        ...payment,
        state: "PAID",
        paidDetail: paidDetail
    }

    // 決済セッションを保存
    // TODO Transaction
    await paymentRef.set(updated)

    const suc: Success & { ticketsId: string[] } = {
        isSuccess: true,
        ticketsId: ticketRes.ticketsId
    }

    return suc
}