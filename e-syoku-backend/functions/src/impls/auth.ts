import {AuthEntry, authEntrySchema, AuthInstance} from "../types/auth";
import {DBRefs, parseData, updateEntireData} from "../utils/db";
import {Error, Result} from "../types/errors";
import {injectError, permissionDeniedError} from "./errors";

export async function getAuthData(refs: DBRefs, uid: string): Promise<AuthEntry | undefined> {
    return await parseData(authEntrySchema, refs.auths.doc(uid), (data) => {
        return {
            uid: uid,
            ...data
        }
    });
}

/**
 * Update Auth Data with allowance of [opAuthedBy]
 * @param refs
 * @param opAuthedBy
 * @param targetUid
 * @param data
 */
export async function updateAuthData(refs: DBRefs, opAuthedBy: AuthInstance, targetUid: string, data: AuthEntry): Promise<Result> {
    if (opAuthedBy.authType != "ADMIN") {
        const err: Error = {
            isSuccess: false,
            ...injectError(permissionDeniedError)
        }
        return err
    }
    return await updateEntireData<AuthEntry>(authEntrySchema, refs.auths.doc(targetUid), data)
}