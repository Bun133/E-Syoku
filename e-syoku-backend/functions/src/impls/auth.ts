import {AuthEntry, authEntrySchema, AuthInstance} from "../types/auth";
import {DBRefs, parseData, updateData} from "../utils/db";

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
 * @param toChangeUID
 * @param data
 */
export async function updateAuthData(refs: DBRefs, opAuthedBy: AuthInstance, toChangeUID: string, data: Partial<AuthEntry>): Promise<boolean> {
    if (opAuthedBy.authType != "ADMIN") return false
    return await updateData(refs.auths.doc(toChangeUID), data);
}