import {firestore} from "firebase-admin";
import {ZodType} from "zod";
import {v4 as uuidv4} from 'uuid';
import Firestore = firestore.Firestore;
import DocumentReference = firestore.DocumentReference;
import DocumentData = firestore.DocumentData;
import CollectionReference = firestore.CollectionReference;

export type DBRefs = {
    tickets: firestore.CollectionReference<firestore.DocumentData>,
    shops: firestore.CollectionReference<firestore.DocumentData>,
    auths: firestore.CollectionReference<firestore.DocumentData>,
    goods: firestore.CollectionReference<firestore.DocumentData>
}

/**
 * Generating DBRefs
 * @param db
 */
export function dbrefs(db: Firestore): DBRefs {
    return {
        tickets: db.collection("tickets"),
        shops: db.collection("shops"),
        auths: db.collection("auths"),
        goods: db.collection("goods")
    };
}

/**
 * Simply Parse data from db using zod type.
 * @param type
 * @param ref
 * @param processing
 */
export function parseData<T, R>(type: ZodType<T>, ref: DocumentReference<firestore.DocumentData>, processing?: (data: DocumentData) => R): Promise<T | undefined> {
    return ref.get().then((doc) => {
        if (doc.exists) {
            let data = doc.data()!!;
            let processed: R | DocumentData = data
            if (processing) {
                processed = processing(data)
            }

            const parsed = type.safeParse(processed);
            if (parsed.success) {
                return parsed.data;
            }
            return undefined;
        } else {
            return undefined;
        }
    });
}

export async function updateData(ref: DocumentReference<firestore.DocumentData>, toUpdate: Partial<DocumentData>): Promise<boolean> {
    const data = await ref.get();
    if (!data.exists) return false;
    await ref.update(toUpdate);
    return true;
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
        console.log("UUID Collided!")
        return newRandomRef(parent);
    }

    return ref;
}