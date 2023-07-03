import {DBRefs, newRandomRef} from "../utils/db";
import {Order} from "../types/order";
import {AuthInstance} from "../types/auth";
import {PaymentSession} from "../types/payment";
import {getGoodsById} from "./goods";

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
    if (!totalAmount.success) {
        return {
            success: false,
            message: totalAmount.message
        }
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

    return {
        success: true,
        paymentSessionId: paymentSession.sessionId
    }
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
        return {
            success: false,
            message: "Failed to get goods data.Operation Terminated"
        }
    }

    const totalAmount = amounts.reduce((a, b) => a + b, 0)

    return {
        success: true,
        totalAmount: totalAmount
    }
}