import {Goods, GoodsRemainData, goodsRemainDataSchema, goodsSchema, WaitingData} from "../types/goods";
import {DBRefs, parseData, parseDataAll, updateEntireData} from "../utils/db";
import {firestore} from "firebase-admin";
import {UniqueId} from "../types/types";
import {error} from "../utils/logger";
import {Order, SingleOrder} from "../types/order";
import {Error, Result, Success, TypedSingleResult} from "../types/errors";
import {
    dbNotFoundError,
    deltaNegativeError,
    injectError,
    itemGoneError,
    remainDataTypeNotKnownError,
    remainStatusNegativeError
} from "./errors";
import Transaction = firestore.Transaction;

export async function getGoodsById(ref: DBRefs, goodsId: UniqueId, transaction?: Transaction): Promise<TypedSingleResult<Goods>> {
    const directRef = ref.goods.doc(goodsId)
    return await parseData<Goods>(dbNotFoundError("goods"), goodsSchema, directRef, (data) => {
        return {
            goodsId: directRef.id,
            description: data.description,
            shopId: data.shopId,
            name: data.name,
            imageUrl: data.imageUrl,
            price: data.price,
        }
    }, transaction)
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
export async function getRemainDataOfGoods(refs: DBRefs, goodsId: UniqueId, transaction?: firestore.Transaction): Promise<TypedSingleResult<GoodsRemainData>> {
    const ref = refs.remains.doc(goodsId)
    return await parseData<GoodsRemainData>(dbNotFoundError("goodsRemainData"), goodsRemainDataSchema, ref, (data) => {
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

        const r: Success & {
            isEnough: boolean
        } = {
            isSuccess: true,
            isEnough: remain
        }
        return r
        // @ts-ignore
    } else if (remainData.remainCount != undefined && typeof remainData.remainCount == "number") {
        // @ts-ignore
        const remainCount = remainData.remainCount as number

        const r: Success & {
            isEnough: boolean
        } = {
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
 * すでに在庫を確保してしまった商品を解放します
 * すでに在庫が確保されているかどうかは確認しません(できません)
 * @param refs
 * @param order
 */
export async function cancelReserveGoods(refs: DBRefs, order: Order): Promise<Success> {
    const canceled: {
        order: SingleOrder,
        reserveResult: Result
    }[] = await Promise.all(order.map(async (single: SingleOrder) => {
        return {
            order: single,
            reserveResult: await cancelReserveSingleGoods(refs, single)
        }
    }))

    // TODO まずい
    // 解放処理が失敗していようと、他の解放処理をロールバックしたりしない(安全側処理)
    const suc: Success = {
        isSuccess: true,
        canceled
    }
    return suc
}

/**
 * 単一のOrderに対して商品の確保を解放します
 * @param refs
 * @param o
 */
async function cancelReserveSingleGoods(refs: DBRefs, o: SingleOrder) {
    return refs.db.runTransaction(async (transaction) => {
        const remainData = await getRemainDataOfGoods(refs, o.goodsId, transaction)
        if (!remainData.isSuccess) {
            return remainData
        } else {
            const calculated = increaseRemainData(remainData.data, o.count)
            if (!calculated.isSuccess) {
                const err: Error = calculated
                return err
            }
            const update = await updateEntireData(goodsRemainDataSchema, refs.remains.doc(o.goodsId), calculated.calculated, transaction)
            if (!update.isSuccess) {
                const err: Error = update
                return err
            }
            const suc: Success = {
                isSuccess: true
            }
            return suc
        }
    })
}

/**
 * 指定された個数分の商品を***すべて確保***します
 * @param refs
 * @param order
 */
export async function reserveGoods(refs: DBRefs, order: Order): Promise<Success & {
    reserved: SingleOrder[]
} | Error & {
    reserved: SingleOrder[],
    notReserved: SingleOrder[]
}> {
    const result: {
        order: SingleOrder,
        reserveResult: Result
    }[] = await Promise.all(order.map(async (single: SingleOrder) => {
        return {
            order: single,
            reserveResult: await reserveSingleGoods(refs, single)
        }
    }))

    const reserved = result.filter(e => e.reserveResult.isSuccess)
    const notReserved = result.filter(e => !e.reserveResult.isSuccess)
    if (notReserved.length == 0) {
        const suc: Success & {
            reserved: SingleOrder[]
        } = {
            isSuccess: true,
            reserved: reserved.map(e => e.order)
        }
        return suc
    } else {
        const error: Error & {
            reserved: SingleOrder[],
            notReserved: SingleOrder[]
        } = {
            isSuccess: false,
            ...injectError(itemGoneError(notReserved.map(e => e.order.goodsId))),
            reserved: reserved.map(e => e.order),
            notReserved: notReserved.map(e => e.order)
        }

        return error
    }
}

/**
 * 単一のOrderに対して商品を確保します
 * @param refs
 * @param o
 */
async function reserveSingleGoods(refs: DBRefs, o: SingleOrder): Promise<Result> {
    return refs.db.runTransaction(async (transaction) => {
        const remainData = await getRemainDataOfGoods(refs, o.goodsId, transaction)
        if (!remainData.isSuccess) {
            const err: Error = remainData
            return err
        } else {
            const calculated = reduceRemainData(remainData.data, o.count)
            if (!calculated.isSuccess) {
                const err: Error = calculated
                return err
            }
            const update = await updateEntireData(goodsRemainDataSchema, refs.remains.doc(o.goodsId), calculated.calculated, transaction)
            if (!update.isSuccess) {
                const err: Error = update
                return err
            }
            const suc: Success = {
                isSuccess: true
            }
            return suc
        }
    })
}

/**
 * 購入などで変更を受けるRemainDataの変更後の値を計算します
 * @param remainData
 * @param decrease 減少する量
 */
function reduceRemainData(remainData: GoodsRemainData, decrease: number): Success & {
    calculated: GoodsRemainData
} | Error {
    if (decrease < 0) {
        const err: Error = {
            isSuccess: false,
            ...injectError(deltaNegativeError)
        }
        return err
    }
    return editRemainData(remainData, -decrease)
}

function increaseRemainData(remainData: GoodsRemainData, increase: number): Success & {
    calculated: GoodsRemainData
} | Error {
    if (increase < 0) {
        const err: Error = {
            isSuccess: false,
            ...injectError(deltaNegativeError)
        }
        return err
    }
    return editRemainData(remainData, increase)
}


function editRemainData(remainData: GoodsRemainData, delta: number): Success & {
    calculated: GoodsRemainData
} | Error {
    // @ts-ignore
    if (remainData.remain != undefined && typeof remainData.remain == "boolean") {
        // Bool値なので変更は手動、よって変化無し
        const suc: Success & {
            calculated: GoodsRemainData
        } = {
            isSuccess: true,
            calculated: remainData
        }
        return suc
        // @ts-ignore
    } else if (remainData.remainCount != undefined && typeof remainData.remainCount == "number") {
        // number値なので、自動で個数を変更
        // @ts-ignore
        const toChange = remainData.remainCount + delta
        if (toChange < 0) {
            error("in reduceRemainData cannot delta.Data:", remainData)
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
        const suc: Success & {
            calculated: GoodsRemainData
        } = {
            isSuccess: true,
            calculated: data
        }
        return suc
    }
    error("in editRemainData cannot decide what type the data is.Data:", remainData)
    const err: Error = {
        isSuccess: false,
        ...injectError(remainDataTypeNotKnownError)
    }
    return err
}


/**
 * 指定された商品の受け取り待ちの人数をカウントして返却します
 * @param refs
 * @param goodsId
 */
export async function getWaitingDataOfGoods(refs: DBRefs, goodsId: string): Promise<TypedSingleResult<WaitingData>> {
    const query = refs.tickets.where("goodsIds", "array-contains", goodsId)
        .where("status", "in", ["PROCESSING", "COOKING"]);

    const waiting = (await query.count().get()).data().count

    return {
        isSuccess: true,
        data: {
            goodsId: goodsId,
            waiting: waiting
        }
    }
}