import {firestore} from "firebase-admin";
import {ZodType} from "zod";
import {v4 as uuidv4} from 'uuid';
import {error, warn} from "./logger";
import {Error, Result, Success} from "../types/errors";
import {injectError, updateDataFailedError} from "../impls/errors";
import Firestore = firestore.Firestore;
import DocumentReference = firestore.DocumentReference;
import DocumentData = firestore.DocumentData;
import CollectionReference = firestore.CollectionReference;
import UpdateData = firestore.UpdateData;

export type DynamicCollectionReference<T> = (t: T) => firestore.CollectionReference<firestore.DocumentData>
// this type is actually string,but this type refers to the id of the user.
export type UserIdDBKey = string

export type DBRefs = {
    db: Firestore,
    tickets: DynamicCollectionReference<UserIdDBKey>,
    shops: firestore.CollectionReference<firestore.DocumentData>,
    auths: firestore.CollectionReference<firestore.DocumentData>,
    goods: firestore.CollectionReference<firestore.DocumentData>,
    remains: firestore.CollectionReference<firestore.DocumentData>,
    payments: DynamicCollectionReference<UserIdDBKey>,
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
    };
}

/**
 * Simply Parse data from db using zod type.
 * @param type
 * @param ref
 * @param processing
 * @param transaction (Transactionインスタンスがある場合はトランザクションで読み取りを行います)
 */
export async function parseData<T, R>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, processing?: (data: DocumentData) => R, transaction?: firestore.Transaction): Promise<T | undefined> {
    let doc;
    if (transaction) {
        doc = await transaction.get(ref)
    } else {
        doc = await ref.get()
    }

    if (doc.exists) {
        let data = doc.data()!!;
        let processed: R | DocumentData = data
        if (processing) {
            processed = processing(data)
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

export async function updateData(ref: DocumentReference<firestore.DocumentData>, toUpdate: Partial<DocumentData>): Promise<boolean> {
    const data = await ref.get();
    if (!data.exists) return false;
    await ref.update(toUpdate);
    return true;
}

export async function updateDataStrict<T extends DocumentData>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, toUpdate: UpdateData<T>, transaction?: firestore.Transaction): Promise<Result> {
    try {
        await ref.update(toUpdate, {exists: true});
    } catch (e) {
        const err: Error = {
            isSuccess: false,
            ...injectError(updateDataFailedError)
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
 */
export async function newRandomRef(parent: CollectionReference): Promise<DocumentReference> {
    let uuid = uuidv4();
    let ref = parent.doc(uuid);
    let data = await ref.get();
    if (data.exists) {
        warn("UUID Collided!")
        return newRandomRef(parent);
    }

    return ref;
}