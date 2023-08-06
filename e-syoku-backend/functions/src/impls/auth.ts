import {AuthEntry, authEntrySchema, AuthType} from "../types/auth";
import {DBRefs, parseData, setData} from "../utils/db";
import {Error, Result, TypedResult} from "../types/errors";
import {authTypeInvalidError, injectError, permissionDataMissing} from "./errors";

export async function getAuthData(refs: DBRefs, uid: string): Promise<TypedResult<AuthEntry>> {
    return await parseData<AuthEntry>("authData",authEntrySchema, refs.auths.doc(uid), (data) => {
        return {
            uid: uid,
            authType: data.authType,
            shopId: data.shopId
        }
    });
}

/**
 * 権限データを更新します
 * @param refs
 * @param targetUid
 * @param data
 */
export async function updateAuthData(refs: DBRefs, targetUid: string, data: AuthEntry): Promise<Result> {
    return await setData<AuthEntry>(authEntrySchema, refs.auths.doc(targetUid), data)
}

/**
 * 指定されたユーザーに指定された権限データを設定します
 * @param refs
 * @param targetUserId
 * @param authType
 * @param shopId
 */
export async function grantPermissionToUser(refs: DBRefs, targetUserId: string, authType: AuthType, shopId?: string): Promise<Result> {
    switch (authType) {
        case "ADMIN":
            return await updateAuthData(refs, targetUserId, {
                authType: "ADMIN",
                uid: targetUserId
            })
        case "SHOP":
            if (!shopId) {
                const err: Error = {
                    isSuccess: false,
                    ...injectError(permissionDataMissing)
                }
                return err
            }
            return await updateAuthData(refs, targetUserId, {
                authType: "SHOP",
                uid: targetUserId,
                shopId: shopId
            })
        case "ANONYMOUS":
            return await updateAuthData(refs, targetUserId, {
                authType: "ANONYMOUS",
                uid: targetUserId
            })
        case "CASHIER":
            return await updateAuthData(refs, targetUserId, {
                authType: "CASHIER",
                uid: targetUserId
            })
        default:
            return {
                isSuccess: false,
                ...injectError(authTypeInvalidError)
            }
    }
}