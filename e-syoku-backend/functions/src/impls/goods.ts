import {Goods, GoodsRemainData, goodsRemainDataSchema, goodsSchema} from "../types/goods";
import {DBRefs, parseData, updateDataStrict} from "../utils/db";
import {firestore} from "firebase-admin";
import {UniqueId} from "../types/types";
import {error} from "../utils/logger";
import {Order} from "../types/order";
import {Error, Result, singleErrorSchema, Success} from "../types/errors";
import {checkOrderRemainStatus} from "./order";
import {
    injectError,
    itemGoneError,
    remainDataCalculateFailedError,
    remainDataTypeNotKnownError,
    remainStatusConflictedError,
    remainStatusNegativeError,
    transactionFailedError,
    updateRemainDataFailedError
} from "./errors";
import DocumentReference = firestore.DocumentReference;

export async function getGoodsById(ref: DBRefs, goodsId: UniqueId): Promise<Goods | undefined> {
    const directRef = ref.goods.doc(goodsId)
    return await getGoodsFromRef(directRef)
}

export async function getGoodsFromRef(ref: DocumentReference): Promise<Goods | undefined> {
    return await parseData(goodsSchema, ref, (data) => {
        return {
            goodsId: ref.id,
            ...data
        }
    })
}

export async function getAllGoods(refs: DBRefs) {
    const all = await refs.goods.listDocuments()
    return await Promise.all(all.map(getGoodsFromRef));
}

/**
 * 在庫情報取得
 * @param refs
 * @param goodsId
 * @param transaction
 */
export async function getRemainDataOfGoods(refs: DBRefs, goodsId: UniqueId, transaction?: firestore.Transaction) {
    const ref = refs.remains.doc(goodsId)
    return await parseData(goodsRemainDataSchema, ref, (data) => {
        return {
            goodsId: ref.id,
            ...data
        }
    }, transaction)
}

/**
 * GoodsRemainDataに対して、必要個数が揃っているかどうかの確認をします
 * @param remainData
 * @param quantity
 */
// TODO Rewrite with Result Type
export function remainDataIsEnough(remainData: GoodsRemainData, quantity: number): undefined | boolean {
    // @ts-ignore
    if (remainData.remain != undefined && typeof remainData.remain == "boolean") {
        // @ts-ignore
        return remainData.remain as boolean
        // @ts-ignore
    } else if (remainData.remainCount != undefined && typeof remainData.remainCount == "number") {
        // @ts-ignore
        return remainData.remainCount >= quantity
    }
    error("in remainDataIsEnough cannot decide what type the data is.Data:", remainData)
    return undefined
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
            // check if all goods are available
            const status = await checkOrderRemainStatus(refs, order, transaction)
            if (!status.isSuccess) {
                const err: Error = status
                return err
            }
            const {isAllEnough, items} = status
            if (!isAllEnough) {
                // not enough goods
                const err: Error = {
                    isSuccess: false,
                    ...injectError(itemGoneError(items.map(i => i.goodsId)))
                }
                return err
            }

            // calculate goods remainData to update
            const calculatedRemainData: (Error | Success & { calculated: GoodsRemainData })[] = order.map((item) => {
                const itemStatus = status.items.find(i => i.goodsId === item.goodsId)
                if (itemStatus === undefined) {
                    const err: Error = {
                        isSuccess: false,
                        ...injectError(remainStatusConflictedError)
                    }
                    return err
                }
                const calculated = calculateModifiedRemainData(itemStatus.remainData, item.count)
                if (!calculated.isSuccess) {
                    const err: Error = calculated
                    return err
                }
                const suc: (Success & { calculated: GoodsRemainData }) = calculated
                return suc
            })

            if (calculatedRemainData.some(i => !i.isSuccess)) {
                // some item cannot be calculated!
                const err: Error = remainDataCalculateFailedError(calculatedRemainData.filter(i => !i.isSuccess).filterInstance(singleErrorSchema))
                return err
            }

            const toUpdate = calculatedRemainData as unknown as (Success & { calculated: GoodsRemainData })[]
            const updateResult = await Promise.all(toUpdate.map(async s => {
                const {goodsId, ...rawRemainData} = s.calculated
                return await updateDataStrict(goodsRemainDataSchema, refs.remains.doc(s.calculated.goodsId), rawRemainData, transaction)
            }))

            const updateFailure = updateResult.filterInstance(singleErrorSchema)
            if (updateFailure.length > 0) {
                // some item cannot be updated!
                //
                const err: Error = updateRemainDataFailedError(updateFailure)
                return err
            }

            const suc: Success = {
                isSuccess: true
            }
            return suc
        })
    } catch (e) {
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