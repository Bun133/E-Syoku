import {auth} from "firebase-admin";
import {HttpsFunction, onRequest, Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {DBRefs} from "./db";
import {AuthInstance, AuthType} from "../types/auth";
import {getAuthData} from "../impls/auth";
import {Error} from "../types/errors";
import {authFailedError, injectError, internalAuthFailedError} from "../impls/errors";
import {ResultOrPromise} from "./endpointUtil";
import Auth = auth.Auth;

/**
 * Using [authed] function, authenticate the request by checking request headers and firebase authentication.
 * @param auth
 * @param refs
 * @param req
 * @param res
 * @param success
 * @param failure
 *
 * @return HttpsFunction
 */
export function onAuthedRequest(auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => void, failure: () => void): HttpsFunction {
    return onRequest(async (req: Request, res: Response) => {
        await authed(auth, refs, req, res, success, failure);
    });
}

/**
 * Authenticate the request by checking request headers and firebase authentication.
 * @param auth
 * @param refs
 * @param req
 * @param res
 * @param success
 * @param failure
 *
 * @return Promise<void>
 */
export async function authed<R>(auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => R | Promise<R>, failure: () => R | Promise<R>): Promise<R> {
    let token = req.headers.authorization;
    if (!token) {
        return failure();
    }

    token = token.replace("Bearer ", "");
    const data = await auth.verifyIdToken(token);
    const uid = data.uid;
    const user = await auth.getUser(uid);

    if (user) {
        let authData = await getAuthData(refs, uid)
        if (authData.isSuccess) {
            let authInstance: AuthInstance = {
                ...authData.data,
                auth: user
            }

            return success(authInstance);
        } else {
            // Succeeded to authenticate user,but failed to get auth data
            const authInstance: AuthInstance = {
                authType: "ANONYMOUS",
                uid: uid,
                auth: user
            }
            return success(authInstance);
        }
    } else {
        return failure();
    }
}

export async function authedWithType(authType: AuthType | AuthType[], auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => ResultOrPromise, failure?: () => ResultOrPromise): Promise<ResultOrPromise> {
    const failedFunction: () => ResultOrPromise = failure != undefined ? failure : () => {
        const err: Error = {
            "isSuccess": false,
            ...injectError(authFailedError)
        }
        const r: ResultOrPromise = {
            result: err
        }
        return r
    }

    return authed<ResultOrPromise>(auth, refs, req, res, async (user: AuthInstance) => {
        if (Array.isArray(authType)) {
            if (authType.includes(user.authType)) {
                return success(user);
            } else {
                return failedFunction();
            }
        } else {
            if (user.authType === authType) {
                return success(user);
            } else {
                return failedFunction();
            }
        }
    }, () => {
        const err: Error = {
            isSuccess: false,
            ...injectError(internalAuthFailedError)
        }
        return {
            result: err
        }
    });
}