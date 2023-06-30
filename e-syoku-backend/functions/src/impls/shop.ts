import {Shop, shopSchema} from "../types/shop";
import {firestore} from "firebase-admin";
import {DBRefs, parseData} from "../db";
import DocumentReference = firestore.DocumentReference;

export async function shopById(ref: DBRefs, id: string): Promise<Shop | undefined> {
    return shopByRef(ref, ref.shops.doc(id));
}

export async function shopByRef(ref: DBRefs, shopRef: DocumentReference<firestore.DocumentData>): Promise<Shop | undefined> {
    return await parseData(shopSchema, shopRef, (data) => {
        return {
            shopId: shopRef.id,
            ...data
        }
    })
}