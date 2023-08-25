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
import {DBRefs, updateEntireData} from "./utils/db";
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
import {prettyGoods, prettyTicket} from "./impls/prettyPrint";
import {getAllGoods, getRemainDataOfGoods} from "./impls/goods";
import {GoodsRemainData, goodsRemainDataSchema} from "./types/goods";
import {PrettyGoods} from "./types/prettyPrint";


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

    const pTicket = await prettyTicket(refs, ticket.data)
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
        // List Remain Data and return
        const allRemainData: TypedSingleResult<{ goods: PrettyGoods, remain: GoodsRemainData }>[] = await Promise.all((await getAllGoods(refs)).map(async e => {
            const remainData = await getRemainDataOfGoods(refs, e.goodsId)
            if (!remainData.isSuccess) {
                return remainData
            }
            const pGoods = await prettyGoods(refs, e)
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
        }))

        const suc: { goods: PrettyGoods, remain: GoodsRemainData }[] = allRemainData.filter(isTypedSuccess).map(e => e.data)
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
    } else {
        const goodsId = requireParameter("goodsId", z.string(), req)
        if (goodsId.param === undefined) return {result: goodsId.error}
        const amount = requireParameter("amount", z.number(), req)
        if (amount.param === undefined) return {result: amount.error}
        // according to op,goodsId,amount update remain data

        const r = await refs.db.runTransaction<SingleResult>(async t => {
            const currentRemain = await getRemainDataOfGoods(refs, goodsId.param, t)
            if (!currentRemain.isSuccess) return currentRemain
            const edited = editRemainData(currentRemain.data, amount.param, op)
            if (!edited.isSuccess) return edited
            const update = await updateEntireData(goodsRemainDataSchema, refs.remains.doc(goodsId.param), edited.data, t)
            if (!update.isSuccess) return update
            return {
                isSuccess: true
            }
        })

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