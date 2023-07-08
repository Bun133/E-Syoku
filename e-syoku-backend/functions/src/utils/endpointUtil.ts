import {ZodType} from "zod";
import {Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {safeAs} from "./safeAs";
import {Error, Result} from "../types/errors";
import {error, logTrace} from "./logger";

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
    error: Error
} {
    if (typeof request.body === "string") {
        request.body = JSON.parse(request.body)
    }

    const parsed = safeAs(type, request.body[paramName]);
    if (parsed === undefined) {
        return {
            param: undefined,
            error: {
                isSuccess: false,
                error: `Missing parameter ${paramName} with Type ${type}`,
                errorCode: "MISSING_PARAMETER"
            }
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

export type ResultOrPromise = {
    result: Result,
    statusCode?: number
} | Promise<{
    result: Result,
    statusCode?: number
}>

async function handleRequest<R extends ResultOrPromise>(request: Request, response: Response, body: () => R) {
    if (response.writableFinished) {
        // response already sent
        error("in handleRequest, response already sent")
        logTrace()
        return
    }
    const result = await body();
    if (result.statusCode === undefined) {
        if (result.result.isSuccess) {
            response.status(200).send(result.result).end();
        } else {
            response.status(500).send(result.result).end();
        }
    } else {
        response.status(result.statusCode).send(result.result).end();
    }
}

export async function onPost<R extends ResultOrPromise>(req: Request, res: Response, body: () => R): Promise<void> {
    if (req.method === "POST") {
        await handleRequest(req, res, body)
    }
}

export async function onGet<R extends ResultOrPromise>(req: Request, res: Response, body: () => R): Promise<void> {
    if (req.method === "GET") {
        await handleRequest(req, res, body)
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