import {firestore} from "firebase-admin";
import {CollectionReference, DocumentData, DocumentReference, Firestore, Transaction} from "firebase-admin/firestore"
import {ZodType} from "zod";
import {v4 as uuidv4} from 'uuid';
import {error, warn} from "./logger";
import {SingleError, SingleResult, Success, TypedSuccess} from "../types/errors";
import {
    createDataFailedError,
    dummyError,
    ErrorType,
    injectError,
    mergeDataFailedError,
    parseDataNotFound,
    parseDataZodFailed,
    setDataFailedError,
    updateDataFailedError
} from "../impls/errors";

export type DynamicCollectionReference<T> = (t: T) => firestore.CollectionReference<firestore.DocumentData>
export type DynamicDocumentReference<T> = (t: T) => DocumentReference<firestore.DocumentData>
// this type is actually string,but this type refers to the id of the user.
export type UserIdDBKey = string
export type ShopIdDBKey = string
export type BarcodeKey = string

export type DBRefs = {
    db: Firestore,
    tickets: firestore.CollectionReference,
    shops: firestore.CollectionReference<firestore.DocumentData>,
    auths: firestore.CollectionReference<firestore.DocumentData>,
    goods: firestore.CollectionReference<firestore.DocumentData>,
    remains: firestore.CollectionReference<firestore.DocumentData>,
    payments: firestore.CollectionReference<firestore.DocumentData>,
    ticketDisplays: DynamicCollectionReference<ShopIdDBKey>,
    ticketNumInfo: DynamicDocumentReference<ShopIdDBKey>,
    ticketBarcode: DynamicDocumentReference<BarcodeKey>,
    barcodeInfos: DynamicDocumentReference<ShopIdDBKey>,
    messageTokens: DynamicDocumentReference<UserIdDBKey>
}

/**
 * Generating DBRefs
 * @param db
 */
export function dbrefs(db: Firestore): DBRefs {
    return {
        db: db,
        tickets: db.collection("tickets"),
        shops: db.collection("shops"),
        auths: db.collection("auths"),
        goods: db.collection("goods"),
        remains: db.collection("remains"),
        payments: db.collection("payments"),
        ticketDisplays: (sid) => db.collection("ticketRefs").doc(sid).collection("ticketDisplays"),
        ticketNumInfo: (sid) => db.collection("ticketRefs").doc(sid).collection("ticketNumInfos").doc("ticketNumInfo"),
        ticketBarcode: (barcode) => db.collection("barcodeBind").doc(barcode),
        barcodeInfos: (sid) => db.collection("ticketRefs").doc(sid).collection("barcodeInfos").doc("barcodeInfo"),
        messageTokens: (uid) => db.collection("messageTokens").doc(uid)
    };
}

type DBDataLike = DocumentReference | firestore.DocumentSnapshot

async function get(data: DBDataLike, transaction?: firestore.Transaction): Promise<firestore.DocumentSnapshot> {
    if (data instanceof DocumentReference) {
        if (transaction) {
            return await transaction.get(data)
        }
        return await data.get()
    } else {
        return data
    }
}

/**
 * Simply Parse data from db using zod type.
 * @param errorType
 * @param type
 * @param dataLike
 * @param transform
 * @param transaction (Transactionインスタンスがある場合はトランザクションで読み取りを行います)
 */
export async function parseData<T extends DocumentData>(errorType: ErrorType, type: ZodType<T>, dataLike: DBDataLike, transform?: (data: DocumentData) => T, transaction?: firestore.Transaction): Promise<TypedSuccess<T> | SingleError> {
    let data = await get(dataLike, transaction)

    if (data.exists) {
        let processed: DocumentData = data.data()!!
        if (transform) {
            processed = transform(processed)
        }

        try {
            const parsed = type.safeParse(processed);
            if (parsed.success) {
                const suc: TypedSuccess<T> = {
                    isSuccess: true,
                    data: parsed.data
                }
                return suc
            } else {
                const err: SingleError = {
                    isSuccess: false,
                    ...injectError(errorType)
                }
                return err;
            }
        } catch (e) {
            error("in ParseData,zod threw an error", e)
            const err: SingleError = {
                isSuccess: false,
                ...injectError(parseDataZodFailed)
            }
            return err
        }

    } else {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(parseDataNotFound)
        }
        return err
    }
}

type DBCollectionLike = CollectionReference | DocumentReference[] | firestore.DocumentSnapshot[]

async function allDocList(collectionLike: DBCollectionLike, transaction?: firestore.Transaction): Promise<firestore.DocumentSnapshot[]> {
    if (collectionLike instanceof CollectionReference) {
        if (transaction) {
            return await transaction.getAll(...await collectionLike.listDocuments())
        } else {
            return await Promise.all((await collectionLike.listDocuments()).map(async e => e.get()))
        }
    } else {
        return await Promise.all(collectionLike.map(async e => {
            if (e instanceof DocumentReference) {
                if (transaction) {
                    return await transaction.get(e)
                } else {
                    return await e.get()
                }
            } else {
                return e
            }
        }))
    }
}

/**
 * Collection内のDocumentすべてに対して[parseData]を行います
 * @param type
 * @param collectionRef
 * @param transform
 * @param transaction
 */
export async function parseDataAll<T extends DocumentData>(type: ZodType<T>, collectionRef: DBCollectionLike, transform?: (doc: DocumentReference<firestore.DocumentData>, data: DocumentData) => T, transaction?: firestore.Transaction): Promise<T[]> {
    let docs = await allDocList(collectionRef)

    return (await Promise.all(docs.map(async (doc) => {
        const transformFunc = transform !== undefined ? (data: DocumentData) => {
            return transform(doc.ref, data)
        } : undefined

        const data = await parseData(dummyError, type, doc, transformFunc, transaction)

        if (data.isSuccess) {
            return data.data
        } else {
            return null
        }
    }))).filterNotNull()
}

export async function parseQueryDataAll<T extends DocumentData>(type: ZodType<T>, query: firestore.Query, transform?: (doc: DocumentReference<firestore.DocumentData>, data: DocumentData) => T, transaction?: firestore.Transaction) {
    return await parseDataAll(type, (await query.get()).docs, transform, transaction)
}

/**
 * [type]全体に合うデータを使ってUpdate処理を行います
 * @param type
 * @param ref
 * @param toUpdate
 * @param transaction
 */
export async function updateEntireData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toUpdate: T, transaction?: firestore.Transaction): Promise<SingleResult> {
    try {
        const data = type.parse(toUpdate)
        if (transaction) {
            transaction.update(ref, data);
        } else {
            await ref.update(data);
        }
    } catch (e) {
        const err: SingleError = {
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
export async function setData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toSet: T, transaction?: firestore.Transaction): Promise<SingleResult> {
    try {
        const data = type.parse(toSet)
        if (transaction) {
            transaction.set(ref, data, {merge: false});
        } else {
            await ref.set(data, {merge: false});
        }
    } catch (e) {
        const err: SingleError = {
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
export async function mergeData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toMerge: T, transaction?: firestore.Transaction): Promise<SingleResult> {
    try {
        const data = type.parse(toMerge)
        if (transaction) {
            transaction.set(ref, data, {merge: true});
        } else {
            await ref.set(data, {merge: true});
        }
    } catch (e) {
        const err: SingleError = {
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
export async function createData<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toCreate: T, transaction?: firestore.Transaction): Promise<SingleResult> {
    try {
        const data = type.parse(toCreate)
        if (transaction) {
            transaction.create(ref, data);
        } else {
            await ref.create(data);
        }
    } catch (e) {
        const err: SingleError = {
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
export async function newRandomRef(parent: CollectionReference, transaction?: Transaction): Promise<DocumentReference> {
    let uuid = uuidv4();
    let ref = parent.doc(uuid);
    let data;
    if (transaction) {
        data = await transaction.get(ref);
    } else {
        data = await ref.get();
    }
    if (data.exists) {
        warn("UUID Collided!")
        return newRandomRef(parent);
    }

    return ref;
}

export async function newRandomBarcode(col: CollectionReference, digits: number) :Promise<string> {
    let code = ""
    for (let i = 0; i < digits; i++) {
        code += Math.floor(Math.random() * 10)
    }

    const query = await col.where("barcode", "==", code).get()
    if (query.empty) {
        return code
    } else {
        return newRandomBarcode(col, digits)
    }
}