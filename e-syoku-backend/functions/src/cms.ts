import {EndpointResult, onPost, requireOptionalParameter, standardFunction} from "./utils/endpointUtil";
import {authedWithType} from "./utils/auth";
import {AuthInstance} from "./types/auth";
import {Auth} from "firebase-admin/lib/auth";
import {DBRefs} from "./utils/db";
import {Error, Result, Success} from "./types/errors";
import {Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {z} from "zod";
import {cmsTicketNotSatisfyCondition, injectError, ticketNotFoundError} from "./impls/errors";
import {ticketByBarcode} from "./impls/barcode";
import {Ticket} from "./types/ticket";
import {ticketById} from "./impls/ticket";


export function cmsFunction(auth: Auth, refs: DBRefs, f: (authInstance: AuthInstance, req: Request, res: Response) => Promise<{
    result: Result,
    statusCode?: number
}>) {
    return standardFunction(async (req, res) => {
        await onPost(req, res, async () => {
            return authedWithType(["ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => f(authInstance, req, res))
        })
    })
}

export async function satisfyCondition(refs: DBRefs, req: Request): Promise<EndpointResult> {
    const uid = requireOptionalParameter("uid", z.string().optional(), req).param
    const ticketId = requireOptionalParameter("ticketId", z.string().optional(), req).param
    const barcode = requireOptionalParameter("barcode", z.string().optional(), req).param

    let ticket: Ticket | undefined = undefined
    let satisfyCondition = false
    if (barcode) {
        satisfyCondition = true
        ticket = await ticketByBarcode(refs, barcode)
    } else if (uid && ticketId) {
        satisfyCondition = true
        ticket = await ticketById(refs, uid, ticketId)
    } else if (uid) {
        // TODO impl
    }

    if (!satisfyCondition) {
        const err: Error = {
            isSuccess: false,
            ...injectError(cmsTicketNotSatisfyCondition)
        }

        return {
            result: err
        }
    }

    if (ticket) {
        const suc: Success = {
            isSuccess: true,
            ticket: ticket
        }
        return {
            result: suc
        }
    } else {
        const err: Error = {
            isSuccess: false,
            ...injectError(ticketNotFoundError)
        }

        return {
            result: err
        }
    }
}