import {auth} from "firebase-admin";
import {HttpsFunction, onRequest, Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import Auth = auth.Auth;

/**
 * Using [authed] function, authenticate the request by checking request headers and firebase authentication.
 * @param auth
 * @param req
 * @param res
 * @param success
 * @param failure
 *
 * @return HttpsFunction
 */
export function onAuthedRequest(auth: Auth, req: Request, res: Response, success: () => void, failure?: () => void): HttpsFunction {
    return onRequest(async (req: Request, res: Response) => {
        await authed(auth, req, res, success, failure);
    });
}

/**
 * Authenticate the request by checking request headers and firebase authentication.
 * @param auth
 * @param req
 * @param res
 * @param success
 * @param failure
 *
 * @return Promise<void>
 */
export async function authed(auth: Auth, req: Request, res: Response, success: () => void, failure ?: () => void): Promise<void> {
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
        success();
    } else {
        failed();
    }
}
