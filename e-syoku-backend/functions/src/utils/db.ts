import {firestore} from "firebase-admin";
import {ZodType} from "zod";
import {v4 as uuidv4} from 'uuid';
import {error, warn} from "./logger";
import {Error, Result, Success} from "../types/errors";
import {
    createDataFailedError,
    injectError,
    mergeDataFailedError,
    setDataFailedError,
    updateDataFailedError
} from "../impls/errors";
import Firestore = firestore.Firestore;
import DocumentReference = firestore.DocumentReference;
import DocumentData = firestore.DocumentData;
import CollectionReference = firestore.CollectionReference;
import Transaction = firestore.Transaction;

export type DynamicCollectionReference<T> = (t: T) => firestore.CollectionReference<firestore.DocumentData>
export type DynamicDocumentReference<T> = (t: T) => DocumentReference<firestore.DocumentData>
// this type is actually string,but this type refers to the id of the user.
export type UserIdDBKey = string
export type ShopIdDBKey = string
export type BarcodeKey = string

export type DBRefs = {
    db: Firestore,
    tickets: DynamicCollectionReference<UserIdDBKey>,
    shops: firestore.CollectionReference<firestore.DocumentData>,
    auths: firestore.CollectionReference<firestore.DocumentData>,
    goods: firestore.CollectionReference<firestore.DocumentData>,
    remains: firestore.CollectionReference<firestore.DocumentData>,
    payments: DynamicCollectionReference<UserIdDBKey>,
    ticketDisplays: DynamicCollectionReference<ShopIdDBKey>,
    ticketNumInfo: DynamicDocumentReference<ShopIdDBKey>,
    binds: DynamicDocumentReference<BarcodeKey>
}

/**
 * Generating DBRefs
 * @param db
 */
export function dbrefs(db: Firestore): DBRefs {
    return {
        db: db,
        tickets: (uid) => db.collection("tickets").doc(uid).collection("tickets"),
        shops: db.collection("shops"),
        auths: db.collection("auths"),
        goods: db.collection("goods"),
        remains: db.collection("remains"),
        payments: (uid) => db.collection("payments").doc(uid).collection("payments"),
        ticketDisplays: (sid) => db.collection("ticketRefs").doc(sid).collection("ticketDisplays"),
        ticketNumInfo: (sid) => db.collection("ticketRefs").doc(sid).collection("ticketNumInfos").doc("ticketNumInfo"),
        binds: (barcode) => db.collection("barcodeBind").doc(Number(barcode).toString())
    };
}

/**
 * Simply Parse data from db using zod type.
 * @param type
 * @param ref
 * @param transform
 * @param transaction (Transactionインスタンスがある場合はトランザクションで読み取りを行います)
 */
export async function parseData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, transform?: (data: DocumentData) => T, transaction?: firestore.Transaction): Promise<T | undefined> {
    let doc;
    if (transaction) {
        doc = await transaction.get(ref)
    } else {
        doc = await ref.get()
    }

    if (doc.exists) {
        let data = doc.data()!!;
        let processed: DocumentData = data
        if (transform) {
            processed = transform(data)
        }

        try {
            const parsed = type.safeParse(processed);
            if (parsed.success) {
                return parsed.data;
            } else {
                error("in ParseData,zod parse failed", parsed.error)
                return undefined;
            }
        } catch (e) {
            error("in ParseData,zod threw an error", e)
        }

        return undefined;
    } else {
        return undefined;
    }
}

/**
 * Collection内のDocumentすべてに対して[parseData]を行います
 * @param type
 * @param collectionRef
 * @param transform
 * @param transaction
 * @param filter
 */
export async function parseDataAll<T extends DocumentData>(type: ZodType<T>, collectionRef: CollectionReference, transform?: (doc: DocumentReference<firestore.DocumentData>, data: DocumentData) => T, transaction?: firestore.Transaction, filter?: (doc: DocumentReference<firestore.DocumentData>) => boolean): Promise<T[]> {
    let docs = await collectionRef.listDocuments()
    if (filter) {
        docs = docs.filter(filter)
    }

    return (await Promise.all(docs.map(async (doc) => {
        const transformFunc = transform !== undefined ? (data: DocumentData) => {
            return transform(doc, data)
        } : undefined

        return await parseData(type, doc, transformFunc, transaction)
    }))).filterNotNull()
}

// TODO 本当にUpdateでいいのか?Set{merge:true}の方がいいのでは?
/**
 * [type]全体に合うデータを使ってUpdate処理を行います
 * @param type
 * @param ref
 * @param toUpdate
 * @param transaction
 */
export async function updateEntireData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toUpdate: T, transaction?: firestore.Transaction): Promise<Result> {
    try {
        if (transaction) {
            await transaction.update(ref, toUpdate);
        } else {
            await ref.update(toUpdate);
        }
    } catch (e) {
        const err: Error = {
            isSuccess: false,
            ...injectError(updateDataFailedError),
            toUpdateRef: ref.path,
            rawError: e,
            toUpdate: toUpdate,
        }
        return err
    }
    const suc: Success = {
        isSuccess: true
    }
    return suc
}

/**
 * [type]に合うデータを使ってSet処理を行います
 * {merge:false}です!
 * @param type
 * @param ref
 * @param toSet
 * @param transaction
 */
export async function setData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toSet: T, transaction?: firestore.Transaction): Promise<Result> {
    try {
        if (transaction) {
            await transaction.set(ref, toSet, {merge: false});
        } else {
            await ref.set(toSet, {merge: false});
        }
    } catch (e) {
        const err: Error = {
            isSuccess: false,
            ...injectError(setDataFailedError),
            toSetRef: ref.path,
            rawError: e,
            toSet: toSet,
        }
        return err
    }
    const suc: Success = {
        isSuccess: true
    }
    return suc
}

/**
 * [type]に合うデータを使用してMerge処理を行います
 * {merge:true}のSet処理を行います
 * @param type
 * @param ref
 * @param toMerge
 * @param transaction
 */
export async function mergeData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toMerge: T, transaction?: firestore.Transaction): Promise<Result> {
    try {
        if (transaction) {
            await transaction.set(ref, toMerge, {merge: true});
        } else {
            await ref.set(toMerge, {merge: true});
        }
    } catch (e) {
        const err: Error = {
            isSuccess: false,
            ...injectError(mergeDataFailedError),
            toMergeRef: ref.path,
            rawError: e,
            toMerge: toMerge,
        }
        return err
    }
    const suc: Success = {
        isSuccess: true
    }
    return suc
}

/**
 * [type]に合うデータを使用してCreate処理を行います
 * @param type
 * @param ref
 * @param toCreate
 * @param transaction
 */
export async function createData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toCreate: T, transaction?: firestore.Transaction): Promise<Result> {
    try {
        if (transaction) {
            transaction.create(ref, toCreate);
        } else {
            await ref.create(toCreate);
        }
    } catch (e) {
        const err: Error = {
            isSuccess: false,
            ...injectError(createDataFailedError),
            toCreateRef: ref.path,
            rawError: e,
            toCreate: toCreate,
        }
        return err
    }
    const suc: Success = {
        isSuccess: true
    }
    return suc
}

/**
 * return random ref in [parent] collection. With checking if the ref is not taken.
 * @param parent
 * @param transaction
 */
export async function newRandomRef(parent: CollectionReference,transaction?:Transaction): Promise<DocumentReference> {
    let uuid = uuidv4();
    let ref = parent.doc(uuid);
    let data;
    if(transaction){
        data = await transaction.get(ref);
    }else{
        data = await ref.get();
    }
    if (data.exists) {
        warn("UUID Collided!")
        return newRandomRef(parent);
    }

    return ref;
}