import {Goods, goodsRemainDataSchema, goodsSchema} from "../types/goods";
import {DBRefs, parseData} from "../db";
import {firestore} from "firebase-admin";
import {UniqueId} from "../types/types";
import DocumentReference = firestore.DocumentReference;

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