import {
    EndpointResult,
    onPost,
    requireOptionalParameter,
    requireParameter,
    standardFunction
} from "./utils/endpointUtil";
import {authedWithType} from "./utils/auth";
import {AuthInstance} from "./types/auth";
import {Auth} from "firebase-admin/lib/auth";
import {DBRefs, parseQueryDataAll, updateEntireData} from "./utils/db";
import {Result, SingleError, SingleResult, Success, TypedSingleResult} from "./types/errors";
import {Request} from "firebase-functions/v2/https";
import {Response} from "firebase-functions";
import {z} from "zod";
import {
    cmsRemainTypeNotMatch,
    cmsTicketNotSatisfyCondition,
    errorResult,
    injectError,
    isSingleError,
    isTypedSuccess,
    ticketNotFoundError
} from "./impls/errors";
import {ticketByBarcode} from "./impls/barcode";
import {Ticket} from "./types/ticket";
import {ticketById} from "./impls/ticket";
import {emptyPrettyCache, getPrettyGoods, prettyCache, prettyPayment, prettyTicket} from "./impls/prettyPrint";
import {getRemainDataOfGoods, listGoodsId} from "./impls/goods";
import {GoodsRemainData, goodsRemainDataSchema} from "./types/goods";
import {PrettyGoods, PrettyPaymentSession} from "./types/prettyPrint";
import {paymentSessionSchema} from "./types/payment";
import {transformPaymentSession} from "./impls/payment";


export function cmsFunction(auth: Auth, refs: DBRefs, endpointName: string, f: (authInstance: AuthInstance, req: Request, res: Response) => Promise<{
    result: Result,
    statusCode?: number
}>) {
    return standardFunction(async (req, res) => {
        await onPost(req, res, auth, endpointName, async () => {
            return authedWithType(["ADMIN"], auth, refs, req, res, async (authInstance: AuthInstance) => f(authInstance, req, res))
        })
    })
}

export async function cmsTicketFunc(refs: DBRefs, req: Request): Promise<EndpointResult> {
    const uid = requireOptionalParameter("uid", z.string().optional(), req).param
    const ticketId = requireOptionalParameter("ticketId", z.string().optional(), req).param
    const barcode = requireOptionalParameter("barcode", z.string().optional(), req).param

    let ticket: TypedSingleResult<Ticket> | undefined = undefined
    let satisfyCondition = false
    if (barcode) {
        satisfyCondition = true
        ticket = await ticketByBarcode(refs, barcode)
    } else if (ticketId) {
        satisfyCondition = true
        ticket = await ticketById(refs, ticketId)
    } else if (uid) {
        // TODO impl
    }

    if (!satisfyCondition) {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(cmsTicketNotSatisfyCondition)
        }

        return {
            result: errorResult(err)
        }
    }

    if (!ticket || !ticket.isSuccess) {
        const err: SingleError = {
            isSuccess: false,
            ...injectError(ticketNotFoundError)
        }

        return {
            result: errorResult(err)
        }
    }

    const pTicket = await prettyTicket(emptyPrettyCache(), refs, ticket.data)
    if (!pTicket.isSuccess) {
        return {
            result: pTicket
        }
    }

    const suc: Success = {
        isSuccess: true,
        ticket: pTicket.data
    }

    return {
        result: suc
    }
}

export async function cmsRemainFunc(refs: DBRefs, req: Request): Promise<EndpointResult> {
    const op = requireOptionalParameter("op", z.enum(["add", "set"]), req).param
    if (!op) {
        return await cmsRemainList(refs, req)
    } else {
        const goodsId = requireParameter("goodsId", z.string(), req)
        if (goodsId.param === undefined) return {result: goodsId.error}
        const amount = requireParameter("amount", z.number(), req)
        if (amount.param === undefined) return {result: amount.error}
        // according to op,goodsId,amount update remain data

        const r = await cmsRemainOperation(refs, goodsId.param, amount.param, op)

        if (!r.isSuccess) {
            return {
                result: errorResult(r)
            }
        }

        return {
            result: r
        }
    }
}

async function cmsRemainList(refs: DBRefs, req: Request): Promise<EndpointResult> {
    const allRemainData: TypedSingleResult<{
        goods: PrettyGoods,
        remain: GoodsRemainData
    }>[] = await prettyCache(async (cache) =>
        await Promise.all((await listGoodsId(refs)).map(async gId => {
            const remainData = await getRemainDataOfGoods(refs, gId)
            if (!remainData.isSuccess) {
                return remainData
            }
            const pGoods = await getPrettyGoods(cache, refs, gId)
            if (!pGoods.isSuccess) {
                return pGoods
            }
            return {
                isSuccess: true,
                data: {
                    goods: pGoods.data,
                    remain: remainData.data
                }
            }
        })))

    const suc: {
        goods: PrettyGoods,
        remain: GoodsRemainData
    }[] = allRemainData.filter(isTypedSuccess).map(e => e.data)
    const err: SingleError[] = allRemainData.filter(isSingleError)
    if (err.length > 0) {
        return {
            result: errorResult(err[0], ...err.slice(1))
        }
    }

    return {
        result: {
            isSuccess: true,
            remainData: suc
        }
    }
}

async function cmsRemainOperation(refs: DBRefs, goodsId: string, amount: number, opString: "set" | "add"): Promise<SingleResult> {
    return await refs.db.runTransaction<SingleResult>(async t => {
        const currentRemain = await getRemainDataOfGoods(refs, goodsId, t)
        if (!currentRemain.isSuccess) return currentRemain
        const edited = editRemainData(currentRemain.data, amount, opString)
        if (!edited.isSuccess) return edited
        const update = await updateEntireData(goodsRemainDataSchema, refs.remains.doc(goodsId), edited.data, t)
        if (!update.isSuccess) return update
        return {
            isSuccess: true
        }
    })
}

function editRemainData(remainData: GoodsRemainData, amount: number, op: "add" | "set"): TypedSingleResult<GoodsRemainData> {
    // @ts-ignore
    if (remainData.remain !== undefined) {
        return {
            isSuccess: false,
            ...injectError(cmsRemainTypeNotMatch)
        }
    }

    if (op === "add") {
        const newRemain: GoodsRemainData = {
            goodsId: remainData.goodsId,
            // @ts-ignore
            remainCount: remainData.remainCount + amount
        }
        return {
            isSuccess: true,
            data: newRemain
        }
    } else if (op === "set") {
        const newRemain: GoodsRemainData = {
            goodsId: remainData.goodsId,
            // @ts-ignore
            remainCount: amount
        }
        return {
            isSuccess: true,
            data: newRemain
        }
    }

    throw new Error("Not Reachable")
}

export async function cmsPaymentListFunc(refs: DBRefs, req: Request): Promise<EndpointResult> {
    const uid = requireParameter("uid", z.string(), req)
    if (uid.param === undefined) return {result: uid.error}

    const payments = await parseQueryDataAll(paymentSessionSchema, refs.payments.where("customerId", "==", uid.param), (doc, data) => transformPaymentSession(doc.id, data))
    const pPayments: PrettyPaymentSession[] = await prettyCache(async (cache) => (await Promise.all(payments.map(async e => {
        return await prettyPayment(cache, refs, e)
    }))).filter(isTypedSuccess).map(e => e.data))

    return {
        result: {
            isSuccess: true,
            payments: pPayments
        }
    }
}