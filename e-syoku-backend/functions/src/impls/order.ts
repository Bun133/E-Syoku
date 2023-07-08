import {DBRefs} from "../utils/db";
import {Order} from "../types/order";
import {getRemainDataOfGoods, remainDataIsEnough} from "./goods";
import {GoodsRemainData} from "../types/goods";
import {AuthInstance} from "../types/auth";
import {internalCreatePaymentSession} from "./payment";
import {injectError, itemGoneError} from "./errors";
import {Error, Success} from "../types/errors";

/**
 * 与えられたOrder内の商品の在庫を確認する
 */
export async function checkOrderRemainStatus(ref: DBRefs, orderData: Order): Promise<{
    items: {
        goodsId: string,
        remainData: GoodsRemainData,
        isEnough: boolean
    }[], isAllEnough: boolean
}> {
    const items = (await Promise.all(orderData.map(async (order) => {
        const remain = await getRemainDataOfGoods(ref, order.goodsId)
        if (!remain) return undefined
        const isEnough = remainDataIsEnough(remain, order.count)
        if (isEnough == undefined) return undefined
        return {
            goodsId: order.goodsId,
            remainData: remain,
            isEnough: isEnough
        }
    }))).filterNotNull({toLog: {message: "in checkOrderRemainStatus, Failed to retrieve remainData for some goods."}})


    const isAllEnough = items.every((item) => item.isEnough)
    return {items, isAllEnough}
}

/**
 * 注文内容から新規決済セッション作成
 */
export async function createPaymentSession(ref: DBRefs, customer: AuthInstance, orderData: Order) {
    // Check Items availability
    const {items, isAllEnough} = await checkOrderRemainStatus(ref, orderData)
    if (!isAllEnough) {
        const err: Error = {
            isSuccess: false,
            ...injectError(itemGoneError(items.filter((item) => !item.isEnough).map((item) => item.goodsId)))
        }
        return err
    }

    // Create Payment Session
    const paymentSession = await internalCreatePaymentSession(ref, customer, orderData)
    if (!paymentSession.isSuccess) {
        // Failed to create Payment Session
        const err: Error = paymentSession
        return err
    }

    const suc: Success & { paymentSessionId: string } = paymentSession
    return suc
}