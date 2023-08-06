import {DBRefs} from "../utils/db";
import {Order} from "../types/order";
import {getRemainDataOfGoods, remainDataIsEnough} from "./goods";
import {GoodsRemainData} from "../types/goods";
import {AuthInstance} from "../types/auth";
import {internalCreatePaymentSession} from "./payment";
import {failedToGetItemDataError, injectError, itemGoneError} from "./errors";
import {Error, Success} from "../types/errors";
import {firestore} from "firebase-admin";

/**
 * 与えられたOrder内の商品の在庫を確認する
 */
export async function checkOrderRemainStatus(ref: DBRefs, orderData: Order, transaction?: firestore.Transaction): Promise<Success & {
    items: {
        goodsId: string,
        remainData: GoodsRemainData,
        isEnough: boolean
    }[], isAllEnough: boolean
} | Error> {
    // 商品の在庫データを取得する
    const items = (await Promise.all(orderData.map(async (order) => {
        const remain = await getRemainDataOfGoods(ref, order.goodsId, transaction)
        if (!remain.isSuccess) return undefined
        const isEnough = remainDataIsEnough(remain.data, order.count)
        if (!isEnough.isSuccess) return undefined
        return {
            goodsId: order.goodsId,
            remainData: remain.data,
            isEnough: isEnough.isEnough
        }
    }))).filterNotNullStrict({toLog: {message: "in checkOrderRemainStatus, Failed to retrieve remainData for some goods."}})

    // 一部の商品の在庫データを取得できなかった
    if (items === undefined) {
        const err: Error = {
            isSuccess: false,
            ...injectError(failedToGetItemDataError)
        }
        return err
    }

    // すべての商品の在庫があるかどうか
    const isAllEnough = items.every((item) => item.isEnough)
    const suc: Success & {
        items: {
            goodsId: string,
            remainData: GoodsRemainData,
            isEnough: boolean
        }[], isAllEnough: boolean
    } = {
        isSuccess: true,
        items: items,
        isAllEnough: isAllEnough
    }
    return suc
}

/**
 * 注文内容から新規決済セッション作成
 */
export async function createPaymentSession(ref: DBRefs, customer: AuthInstance, orderData: Order): Promise<Error | Success & {
    paymentSessionId: string
}> {
    // 商品の在庫があることを確認
    const status = await checkOrderRemainStatus(ref, orderData)
    if (!status.isSuccess) {
        const err: Error = status
        return err
    }
    if (!(status.isAllEnough)) {
        // 商品の一部が欠品
        const err: Error = {
            isSuccess: false,
            ...injectError(itemGoneError((status.items).filter((item) => !item.isEnough).map((item) => item.goodsId)))
        }
        return err
    }

    // 新規決済セッションを作成
    const paymentSession = await internalCreatePaymentSession(ref, customer, orderData)
    if (!paymentSession.isSuccess) {
        // Failed to create Payment Session
        const err: Error = paymentSession
        return err
    }

    const suc: Success & { paymentSessionId: string } = paymentSession
    return suc
}