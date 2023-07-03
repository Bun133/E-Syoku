import {Goods, GoodsRemainData, goodsRemainDataSchema, goodsSchema} from "../types/goods";
import {DBRefs, parseData} from "../utils/db";
import {firestore} from "firebase-admin";
import {UniqueId} from "../types/types";
import {error} from "../utils/logger";
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
 */
export async function getRemainDataOfGoods(refs: DBRefs, goodsId: UniqueId) {
    const ref = refs.remains.doc(goodsId)
    return await parseData(goodsRemainDataSchema, ref, (data) => {
        return {
            goodsId: ref.id,
            ...data
        }
    })
}

/**
 * GoodsRemainDataに対して、必要個数が揃っているかどうかの確認をします
 * @param remainData
 * @param quantity
 */
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