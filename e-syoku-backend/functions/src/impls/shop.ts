import {Shop, shopSchema} from "../types/shop";
import {DBRefs, parseDataAll} from "../utils/db";

export async function listAllShop(ref: DBRefs):Promise<Shop[]> {
    return parseDataAll<Shop>("shop",shopSchema,ref.shops,(doc, data)=>{
        return {
            name: data.name,
            shopId: doc.id
        }
    })
}