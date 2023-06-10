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
    const parsed = safeAs(type, request.body[paramName]);
    if (parsed === undefined) {
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
        "isSuccess":false,
        "error": `No endpoint for ${req.method} Method at this endpoint`,
    })
}