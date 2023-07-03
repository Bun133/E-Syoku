import {auth} from "firebase-admin";
import {HttpsFunction, onRequest, Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {DBRefs} from "./db";
import {AuthInstance, AuthType} from "../types/auth";
import {getAuthData} from "../impls/auth";
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
export function onAuthedRequest(auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => void, failure?: () => void): HttpsFunction {
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
export async function authed(auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => void | Promise<void>, failure ?: () => void): Promise<void> {
    function failed() {
        if (failure) {
            failure();
        }
    }

    let token = req.headers.authorization;
    if (!token) {
        failed();
        return;
    }

    token = token.replace("Bearer ", "");
    const data = await auth.verifyIdToken(token);
    const uid = data.uid;
    const user = await auth.getUser(uid);

    if (user) {
        let authData = await getAuthData(refs, uid)
        if (authData) {
            let authInstance: AuthInstance = {
                ...authData,
                auth: user
            }

            await success(authInstance);
        } else {
            // Succeeded to authenticate user,but failed to get auth data
            const authInstance: AuthInstance = {
                authType: "ANONYMOUS",
                uid: uid,
                auth: user
            }
            await success(authInstance);
        }
    } else {
        failed();
    }
}

// TODO failure を必須にする
export async function authedWithType(authType: AuthType | AuthType[], auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => void | Promise<void>, failure?: () => void | Promise<void>) {
    const failureFunc = failure !== undefined ? failure : () => {
        res.status(401).send({"isSuccess": false, "error": "Unauthorized"});
    }
    await authed(auth, refs, req, res, async (user: AuthInstance) => {
        if (Array.isArray(authType)) {
            if (authType.includes(user.authType)) {
                await success(user);
            } else {
                await failureFunc();
            }
        } else {
            if (user.authType === authType) {
                await success(user);
            } else {
                await failureFunc();
            }
        }
    }, failure);
}