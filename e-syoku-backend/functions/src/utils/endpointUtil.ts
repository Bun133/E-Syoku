import {ZodType} from "zod";
import {onRequest, Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {safeAs} from "./safeAs";
import {Error as EError, Result} from "../types/errors";
import {error, logTrace, writeLog} from "./logger";
import {errorResult, injectError, internalErrorThrownError} from "../impls/errors";
import {Auth} from "firebase-admin/lib/auth";

/**
 * Require a parameter from the request
 * if parameter doesn't exist,or is invalid, return a 400 error with the error message
 * @param paramName
 * @param type
 * @param request
 */
export function requireParameter<Z>(paramName: string, type: ZodType<Z>, request: Request): {
    param: Z
} | {
    param: undefined,
    error: EError
} {
    if (typeof request.body === "string") {
        request.body = JSON.parse(request.body)
    }

    const parsed = safeAs(type, request.body[paramName]);
    if (parsed === undefined) {
        return {
            param: undefined,
            error: errorResult({
                isSuccess: false,
                error: `Missing parameter ${paramName}`,
                errorCode: "MISSING_PARAMETER"
            })
        }
    } else {
        return {
            param: parsed
        }
    }
}

export function requireOptionalParameter<Z>(paramName: string, type: ZodType<Z>, request: Request): {
    param: Z | undefined
} {
    if (!type.isOptional()) {
        error("requireOptionalParameter called on non optional type")
    }
    if (typeof request.body === "string") {
        request.body = JSON.parse(request.body)
    }
    const parsed = safeAs(type, request.body[paramName]);
    return {
        param: parsed
    }
}

export type EndpointResult = {
    result: Result,
}

export type ResultOrPromise = EndpointResult | Promise<EndpointResult>

async function getUid(req: Request, auth: Auth): Promise<string | undefined> {
    let token = req.headers.authorization;
    if (!token) return undefined
    token = token.replace("Bearer ", "");
    try {
        const data = await auth.verifyIdToken(token);
        return data.uid
    } catch (e) {
        writeLog({
            severity: "ERROR",
            error: e,
            message: "Failed to get Uid"
        })
        return undefined
    }
}

async function handleRequest<R extends ResultOrPromise>(request: Request, response: Response, auth: Auth, endpointName: string, body: () => R) {
    if (response.writableFinished) {
        // response already sent
        error("in handleRequest, response already sent")
        logTrace()
        return
    }

    const uid = await getUid(request, auth)

    try {
        const result = await body();
        if (result.result.isSuccess) {
            writeLog({
                severity: "INFO",
                response: result.result,
                endpointName:endpointName,
                uid: uid
            })
            response.status(200).send(result.result).end();
        } else {
            writeLog({
                severity: "ERROR",
                response: result.result,
                path: request.path,
                endpointName:endpointName,
                uid: uid
            })
            response.status(500).send(result.result).end();
        }
    } catch (e) {
        const rawErrorMessage = e instanceof Error ? e.message : "Not ES6 Error"
        // @ts-ignore
        const stack = e.stack !== undefined ? e.stack : "No Stack"
        const err: EError = {
            isSuccess: false,
            ...injectError(internalErrorThrownError),
            // @ts-ignore
            rawError: rawErrorMessage,
            stack: stack
        }
        writeLog({
            severity: "ERROR",
            ...err
        })
        response.status(500).send(err).end();
    }
}

export async function onPost<R extends ResultOrPromise>(req: Request, res: Response, auth: Auth, endpointName: string, body: () => R): Promise<void> {
    if (req.method === "POST") {
        await handleRequest(req, res, auth, endpointName, body)
    }
}

/**
 * Request not matched at this endpoint,returning a 404 error with the error message
 * @param req
 * @param res
 */
export function endOfEndPoint(req: Request, res: Response) {
    if (res.writableEnded) return

    res.status(404).send({
        "isSuccess": false,
        "error": `No endpoint for ${req.method} Method at this endpoint`,
    }).end()
}

let origin: string = "";
if (process.env["FUNCTIONS_EMULATOR"]) {
    origin = "*";
} else {
    origin = "https://e-syoku.web.app";
}

export function applyHeaders(s: Response) {
    s.header("Access-Control-Allow-Origin", origin);
    s.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
    s.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept , Authorization");
    s.header("Content-Type", "application/json")
}

export function handleOption(q: Request, s: Response) {
    if (q.method === "OPTIONS") {
        s.status(200).send({data: "OPTIONS"}).end();
        return true
    }

    return false
}

export function standardFunction(f: (req: Request, res: Response) => Promise<void>) {
    return onRequest({
        region: "asia-northeast1",
        memory: "256MiB",
        cpu: 1
    }, async (request, response) => {
        applyHeaders(response)
        if (handleOption(request, response)) return
        await f(request, response);
        endOfEndPoint(request, response)
    })
}