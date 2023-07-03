import {ZodType} from "zod";
import {Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {safeAs} from "./safeAs";

/**
 * Require a parameter from the request
 * if parameter doesn't exist,or is invalid, return a 400 error with the error message
 * @param paramName
 * @param type
 * @param request
 * @param response
 */
export function requireParameter<Z>(paramName: string, type: ZodType<Z>, request: Request, response: Response): Z | undefined {
    if (typeof request.body === "string") {
        request.body = JSON.parse(request.body)
    }

    const parsed = safeAs(type, request.body[paramName]);
    if (parsed === undefined && !type.isOptional()) {
        response.status(400).send({
            "error": `Missing parameter ${paramName} with Type ${type}`,
            "paramName": paramName
        }).end();
        return undefined;
    } else {
        return parsed;
    }
}

export async function onPost<R extends void | Promise<void>>(req: Request, res: Response, body: () => R): Promise<void> {
    if (res.writableFinished) return

    if (req.method === "POST") {
        await body();
    }
}

export async function onGet<R extends void | Promise<void>>(req: Request, res: Response, body: () => R): Promise<void> {
    if (req.method === "GET") {
        await body();
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
    // TODO 書く
    origin = "https://";
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