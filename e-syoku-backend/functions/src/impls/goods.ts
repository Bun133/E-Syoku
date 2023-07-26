import {Goods, GoodsRemainData, goodsRemainDataSchema, goodsSchema} from "../types/goods";
import {DBRefs, mergeData, parseData, parseDataAll} from "../utils/db";
import {firestore} from "firebase-admin";
import {UniqueId} from "../types/types";
import {error} from "../utils/logger";
import {Order} from "../types/order";
import {Error, Result, singleErrorSchema, Success} from "../types/errors";
import {checkOrderRemainStatus} from "./order";
import {
    ErrorThrower,
    injectError,
    itemGoneError,
    remainDataCalculateFailedError,
    remainDataTypeNotKnownError,
    remainStatusNegativeError,
    remainStatusNotFoundError,
    transactionFailedError,
    updateRemainDataFailedError
} from "./errors";

export async function getGoodsById(ref: DBRefs, goodsId: UniqueId): Promise<Goods | undefined> {
    const directRef = ref.goods.doc(goodsId)
    return await parseData<Goods>(goodsSchema, directRef, (data) => {
        return {
            goodsId: directRef.id,
            description: data.description,
            shopId: data.shopId,
            name: data.name,
            imageUrl: data.imageUrl,
            price: data.price,
        }
    })
}

export async function getAllGoods(refs: DBRefs): Promise<Goods[]> {
    return await parseDataAll<Goods>(goodsSchema, refs.goods, (doc, data) => {
        return {
            goodsId: doc.id,
            description: data.description,
            shopId: data.shopId,
            name: data.name,
            imageUrl: data.imageUrl,
            price: data.price,
        }
    })
}

/**
 * 在庫情報取得
 * @param refs
 * @param goodsId
 * @param transaction
 */
export async function getRemainDataOfGoods(refs: DBRefs, goodsId: UniqueId, transaction?: firestore.Transaction) {
    const ref = refs.remains.doc(goodsId)
    return await parseData<GoodsRemainData>(goodsRemainDataSchema, ref, (data) => {
        return {
            goodsId: ref.id,
            remainCount: data.remainCount,
            remain: data.remain
        }
    }, transaction)
}

/**
 * GoodsRemainDataに対して、必要個数が揃っているかどうかの確認をします
 * @param remainData
 * @param quantity
 */
export function remainDataIsEnough(remainData: GoodsRemainData, quantity: number): Error | Success & {
    isEnough: boolean
} {
    // @ts-ignore
    if (remainData.remain != undefined && typeof remainData.remain == "boolean") {
        // @ts-ignore
        const remain = remainData.remain as boolean

        const r: Success & { isEnough: boolean } = {
            isSuccess: true,
            isEnough: remain
        }
        return r
        // @ts-ignore
    } else if (remainData.remainCount != undefined && typeof remainData.remainCount == "number") {
        // @ts-ignore
        const remainCount = remainData.remainCount as number

        const r: Success & { isEnough: boolean } = {
            isSuccess: true,
            isEnough: remainCount >= quantity
        }
        return r
    }
    error("in remainDataIsEnough cannot decide what type the data is.Data:", remainData)
    const r: Error = {
        isSuccess: false,
        ...injectError(remainDataTypeNotKnownError)
    }
    return r
}

/**
 * 指定された個数分の商品を***すべて確保***します
 * 一部でも在庫が足りなかった場合はすべてロールバックします
 * @param refs
 * @param order
 */
export async function reserveGoods(refs: DBRefs, order: Order): Promise<Result> {
    try {
        return await refs.db.runTransaction(async (transaction) => {
            // 商品がすべてそろっていることを確認
            const status = await checkOrderRemainStatus(refs, order, transaction)
            if (!status.isSuccess) {
                const err: Error = status
                throw new ErrorThrower(err)
            }
            const {isAllEnough, items} = status
            if (!isAllEnough) {
                // 一部の商品の在庫がなくなっている場合
                const err: Error = {
                    isSuccess: false,
                    ...injectError(itemGoneError(items.map(i => i.goodsId)))
                }
                throw new ErrorThrower(err)
            }

            // 更新後の在庫情報を計算
            const calculatedRemainData: (Error | Success & { calculated: GoodsRemainData })[] = order.map((item) => {
                const itemStatus = status.items.find(i => i.goodsId === item.goodsId)
                if (itemStatus === undefined) {
                    const err: Error = {
                        isSuccess: false,
                        ...injectError(remainStatusNotFoundError)
                    }
                    throw new ErrorThrower(err)
                }
                const calculated = calculateModifiedRemainData(itemStatus.remainData, item.count)
                if (!calculated.isSuccess) {
                    const err: Error = calculated
                    throw new ErrorThrower(err)
                }
                const suc: (Success & { calculated: GoodsRemainData }) = calculated
                return suc
            })

            if (calculatedRemainData.some(i => !i.isSuccess)) {
                // 更新後の在庫情報が計算できないものが合った場合エラー
                const err: Error = remainDataCalculateFailedError(calculatedRemainData.filter(i => !i.isSuccess).filterInstance(singleErrorSchema))
                throw new ErrorThrower(err)
            }

            const toUpdate = calculatedRemainData as unknown as (Success & { calculated: GoodsRemainData })[]
            const updateResult = await Promise.all(toUpdate.map(async s => {
                const {goodsId, ...rawRemainData} = s.calculated
                return await mergeData(goodsRemainDataSchema, refs.remains.doc(s.calculated.goodsId), rawRemainData, transaction)
            }))

            const updateFailure = updateResult.filterInstance(singleErrorSchema)
            if (updateFailure.length > 0) {
                // 一部の商品の在庫情報の更新に失敗したのでロールバック
                const err: Error = updateRemainDataFailedError(updateFailure)
                throw new ErrorThrower(err)
            }

            const suc: Success = {
                isSuccess: true
            }
            return suc
        })
    } catch (e) {
        if(e instanceof ErrorThrower) {
            // Transactionの内側のエラーをcatch
            const err: Error = e.error
            return err
        }

        // failed
        const err: Error = {
            isSuccess: false,
            ...injectError(transactionFailedError),
            rawError: e
        }
        return err
    }
}

/**
 * 購入などで変更を受けるRemainDataの変更後の値を計算します
 * @param remainData
 * @param decrease 減少する量
 */
function calculateModifiedRemainData(remainData: GoodsRemainData, decrease: number): Success & {
    calculated: GoodsRemainData
} | Error {
    // @ts-ignore
    if (remainData.remain != undefined && typeof remainData.remain == "boolean") {
        // Bool値なので変更は手動、よって変化無し
        const suc: Success & { calculated: GoodsRemainData } = {
            isSuccess: true,
            calculated: remainData
        }
        return suc
        // @ts-ignore
    } else if (remainData.remainCount != undefined && typeof remainData.remainCount == "number") {
        // number値なので、自動で個数を変更
        // @ts-ignore
        const toChange = remainData.remainCount - decrease
        if (toChange < 0) {
            error("in calculateModifiedRemainData cannot decrease.Data:", remainData)
            const err: Error = {
                isSuccess: false,
                ...injectError(remainStatusNegativeError)
            }
            return err
        }
        const data: GoodsRemainData = {
            goodsId: remainData.goodsId,
            remainCount: toChange
        }
        const suc: Success & { calculated: GoodsRemainData } = {
            isSuccess: true,
            calculated: data
        }
        return suc
    }
    error("in remainDataIsEnough cannot decide what type the data is.Data:", remainData)
    const err: Error = {
        isSuccess: false,
        ...injectError(remainDataTypeNotKnownError)
    }
    return err
}