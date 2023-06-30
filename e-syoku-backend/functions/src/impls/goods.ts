import {Goods, goodsSchema} from "../types/goods";
import {DBRefs, parseData} from "../db";
import {firestore} from "firebase-admin";
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