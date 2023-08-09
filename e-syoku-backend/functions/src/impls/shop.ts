import {Shop, shopSchema} from "../types/shop";
import {DBRefs, parseData, parseDataAll} from "../utils/db";
import {TypedSingleResult} from "../types/errors";
import {notFoundError} from "./errors";

export async function listAllShop(ref: DBRefs): Promise<Shop[]> {
    return parseDataAll<Shop>(shopSchema, ref.shops, (doc, data) => {
        return {
            name: data.name,
            shopId: doc.id
        }
    })
}

export async function getShopById(refs: DBRefs, shopId: string): Promise<TypedSingleResult<Shop>> {
    return parseData(notFoundError("shop"), shopSchema, refs.shops.doc(shopId), (data) => {
        return {
            name: data.name,
            shopId: shopId
        }
    })
}