import {DBRefs} from "../utils/db";
import {Order} from "../types/order";
import {getRemainDataOfGoods, remainDataIsEnough} from "./goods";
import {GoodsRemainData} from "../types/goods";
import {AuthInstance} from "../types/auth";
import {internalCreatePaymentSession} from "./payment";
import {
    errorResult,
    failedToGetItemDataError,
    injectError,
    isError,
    isSingleError,
    isTypedSuccess,
    itemGoneError,
    paymentCreateFailedError
} from "./errors";
import {Error, SingleError, Success, TypedSingleResult} from "../types/errors";
import {firestore} from "firebase-admin";

type RemainData = {
    goodsId: string,
    remainData: GoodsRemainData,
    isEnough: boolean
}

/**
 * 与えられたOrder内の商品の在庫を確認する
 */
export async function checkOrderRemainStatus(ref: DBRefs, orderData: Order, transaction?: firestore.Transaction): Promise<Success & {
    items: {
        goodsId: string,
        remainData: GoodsRemainData,
        isEnough: boolean
    }[],
    isAllEnough: boolean
} | Error> {
    // 商品の在庫データを取得する
    const items: TypedSingleResult<RemainData>[] = (await Promise.all(orderData.map(async (order) => {
        const remain = await getRemainDataOfGoods(ref, order.goodsId, transaction)
        if (isSingleError(remain)) return remain
        const isEnough = remainDataIsEnough(remain.data, order.count)
        if (isSingleError(isEnough)) return isEnough
        return {
            isSuccess: true,
            data: {
                goodsId: order.goodsId,
                remainData: remain.data,
                isEnough: isEnough.isEnough
            }
        }
    })))

    const sucItems: RemainData[] = items.filter(isTypedSuccess).map((item) => item.data)
    const errItems: SingleError[] = items.filter(isSingleError)

    // 一部の商品の在庫データを取得できなかった
    if (errItems.length > 0) {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(failedToGetItemDataError)
        }

        return errorResult(err, ...errItems)
    }

    // すべての商品の在庫があるかどうか
    const isAllEnough = sucItems.every((item) => item.isEnough)
    const suc: Success & {
        items: {
            goodsId: string,
            remainData: GoodsRemainData,
            isEnough: boolean
        }[],
        isAllEnough: boolean
    } = {
        isSuccess: true,
        items: sucItems,
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
    if (isError(status)) {
        return status
    }
    if (!(status.isAllEnough)) {
        // 商品の一部が欠品
        const err: SingleError = {
            isSuccess: false,
            ...injectError(itemGoneError((status.items).filter((item) => !item.isEnough).map((item) => item.goodsId)))
        }
        return errorResult(err)
    }

    // 新規決済セッションを作成
    const paymentSession = await internalCreatePaymentSession(ref, customer, orderData)
    if (isError(paymentSession)) {
        // Failed to create Payment Session
        return errorResult({
            isSuccess: false,
            ...injectError(paymentCreateFailedError)
        }, paymentSession)
    }

    const suc: Success & {
        paymentSessionId: string
    } = paymentSession
    return suc
}