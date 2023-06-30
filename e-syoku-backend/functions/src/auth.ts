import {auth} from "firebase-admin";
import {HttpsFunction, onRequest, Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {DBRefs} from "./db";
import Auth = auth.Auth;
import {AuthInstance, AuthType} from "./types/auth";
import {getAuthData} from "./impls/auth";

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
            failed();
            return;
        }
    } else {
        failed();
    }
}


export async function authedWithType(authType: AuthType, auth: Auth, refs: DBRefs, req: Request, res: Response, success: (authInstance: AuthInstance) => void | Promise<void>, failure?: () => void) {
    await authed(auth, refs, req, res, async (user: AuthInstance) => {
        if (user.authType === authType) {
            await success(user);
        } else {
            if (failure) {
                failure();
            }
        }
    }, failure);
}