import {DBRefs, newRandomRef, parseData} from "../utils/db";
import {Order} from "../types/order";
import {AuthInstance} from "../types/auth";
import {PaidDetail, PaymentSession, paymentSessionSchema} from "../types/payment";
import {getGoodsById} from "./goods";
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
import DocumentReference = firestore.DocumentReference;

/**
 * 実際に決済セッションを作成し、DBに登録
 * ***商品の在庫を確認しません***
 * @param ref
 * @param customer
 * @param order
 */
export async function internalCreatePaymentSession(ref: DBRefs, customer: AuthInstance, order: Order) {
    const paymentSessionRef = await newRandomRef(ref.payments(customer.uid))

    const totalAmount = await calculateTotalAmount(ref, order)
    if (!totalAmount.isSuccess) {
        const err: Error = totalAmount
        return err
    }

    const paymentSession: PaymentSession = {
        customerId: customer.uid,
        orderContent: order,
        sessionId: paymentSessionRef.id,
        state: "UNPAID",
        totalAmount: totalAmount.totalAmount!
    }

    // save payment session to DB,except for sessionId
    await paymentSessionRef.set({
        customerId: paymentSession.customerId,
        orderContent: paymentSession.orderContent,
        state: paymentSession.state,
        totalAmount: paymentSession.totalAmount
    })

    const suc: Success & { paymentSessionId: string } = {
        isSuccess: true,
        paymentSessionId: paymentSession.sessionId
    }

    return suc
}

async function calculateTotalAmount(ref: DBRefs, order: Order) {
    const amounts = (await Promise.all(
            order.map(async (o) => {
                const data = await getGoodsById(ref, o.goodsId)
                if (!data) return undefined
                return data.price * o.count
            }))
    ).filterNotNullStrict({toLog: {message: "in calculateTotalAmount,Failed to get goods data.Operation Terminated"}})

    if (!amounts) {
        // since the amounts is undefined, the operation is terminated
        const err: Error = {
            isSuccess: false,
            ...injectError(calculateTotalAmountFailed)
        }
        return err
    }

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
    return parseData(paymentSessionSchema, paymentRef, (data) => {
        return {
            sessionId: paymentRef.id,
            ...data
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
 * @param refs
 * @param uid
 * @param sessionId
 * @param paidDetail
 */
export async function markPaymentAsPaid(refs: DBRefs, uid: string, sessionId: string, paidDetail: PaidDetail) {
    const ref = refs.payments(uid).doc(sessionId)
    const payment = await getPaymentSessionByRef(refs, ref)

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
    const {items, isAllEnough} = await checkOrderRemainStatus(refs, payment.orderContent)
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

    // TODO 商品の在庫を確保する(在庫数を減らす)
    // TODO 食券を発行する

    // change state
    const updated: PaymentSession = {
        ...payment,
        state: "PAID",
        paidDetail: paidDetail
    }

    // save to DB
    await ref.set(updated)

    const suc: Success = {
        isSuccess: true
    }

    return suc
}