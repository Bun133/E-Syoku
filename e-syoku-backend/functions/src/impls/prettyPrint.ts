import {Ticket, TicketStatus} from "../types/ticket";
import {DBRefs} from "../utils/db";
import {
    PrettyGoods,
    PrettyOrder,
    PrettyPaymentSession,
    PrettyPaymentState,
    PrettySingleOrder,
    PrettyTicket,
    PrettyTicketStatus,
    PrettyTimeStamp
} from "../types/prettyPrint";
import {Timestamp} from "firebase-admin/firestore";
import {Order, SingleOrder} from "../types/order";
import {getGoodsById} from "./goods";
import {SingleError, TypedResult, TypedSingleResult, TypedSuccess} from "../types/errors";
import {Goods} from "../types/goods";
import {getShopById} from "./shop";
import {
    errorResult,
    injectError,
    isError,
    isSingleError,
    isTypedSuccess,
    prettyOrderFailed,
    prettyTicketFailed
} from "./errors";
import {PaymentSession, PaymentState} from "../types/payment";

function prettyTimeStamp(timeStamp: Timestamp): PrettyTimeStamp {
    const date = timeStamp.toDate();
    return {
        utcSeconds: date.getTime() / 1000,
    }
}

export async function prettyGoods(refs: DBRefs, goods: Goods): Promise<TypedSingleResult<PrettyGoods>> {
    const shop = await getShopById(refs, goods.shopId)
    if (isSingleError(shop)) {
        return shop
    }
    const suc: TypedSuccess<PrettyGoods> = {
        isSuccess: true,
        data: {
            shop: shop.data,
            goodsId: goods.goodsId,
            name: goods.name,
            price: goods.price,
            description: goods.description,
            imageRefPath: goods.imageRefPath,
        }
    }

    return suc
}

export async function prettySingleOrder(refs: DBRefs, order: SingleOrder): Promise<TypedSingleResult<PrettySingleOrder>> {
    const goodsData = await getGoodsById(refs, order.goodsId)
    if (isSingleError(goodsData)) {
        return goodsData
    }
    const pGoods = await prettyGoods(refs, goodsData.data)
    if (isSingleError(pGoods)) {
        return pGoods
    }
    const suc: TypedSuccess<PrettySingleOrder> = {
        isSuccess: true,
        data: {
            goods: pGoods.data,
            count: order.count,
        }
    }
    return suc
}

export async function prettyOrder(refs: DBRefs, order: Order): Promise<TypedResult<PrettyOrder>> {
    const singles = await Promise.all(order.map(single => prettySingleOrder(refs, single)))
    const errors: SingleError[] = []
    const successes: TypedSuccess<PrettySingleOrder>[] = []

    for (const single of singles) {
        if (isTypedSuccess(single)) {
            successes.push(single)
        } else {
            errors.push(single)
        }
    }


    if (errors.length > 0) {
        return errorResult({
            isSuccess: false, ...injectError(prettyOrderFailed)
        }, ...errors)
    } else {
        const order: PrettySingleOrder[] = successes.map(single => single.data)
        const suc: TypedSuccess<PrettyOrder> = {
            isSuccess: true,
            data: order
        }

        return suc
    }
}

export function prettyStatus(status: TicketStatus): PrettyTicketStatus {
    switch (status) {
        case "PROCESSING":
            return "注文済み"
        case "COOKING":
            return "調理中"
        case "CALLED":
            return "受け取り待ち"
        case "RESOLVED":
            return "完了"
        case "INFORMED":
            return "お知らせ"
    }
}

export async function prettyTicket(refs: DBRefs, ticket: Ticket): Promise<TypedResult<PrettyTicket>> {
    const issueTime = prettyTimeStamp(ticket.issueTime)
    const lastUpdatedTime = prettyTimeStamp(ticket.lastStatusUpdated)
    const order = await prettyOrder(refs, ticket.orderData)
    if (isError(order)) {
        return order
    }
    const status = prettyStatus(ticket.status)
    const shop = await getShopById(refs, ticket.shopId)
    if (isSingleError(shop)) {
        return errorResult({
            isSuccess: false,
            ...injectError(prettyTicketFailed)
        }, shop)
    }
    const prettyTicket: PrettyTicket = {
        issueTime: issueTime,
        status: status,
        lastStatusUpdated: lastUpdatedTime,
        orderData: order.data,
        uniqueId: ticket.uniqueId,
        shop: shop.data,
        customerId: ticket.customerId,
        ticketNum: ticket.ticketNum,
        paymentSessionId: ticket.paymentSessionId,
    }

    const suc: TypedSuccess<PrettyTicket> = {
        isSuccess: true,
        data: prettyTicket
    }

    return suc
}

function prettyPaymentStatus(state: PaymentState): PrettyPaymentState {
    switch (state) {
        case "PAID":
            return "支払い済み"
        case "UNPAID":
            return "未支払い"
    }
}

export async function prettyPayment(refs: DBRefs, payment: PaymentSession): Promise<TypedResult<PrettyPaymentSession>> {
    const pOrder = await prettyOrder(refs, payment.orderContent)
    if (isError(pOrder)) {
        return pOrder
    }

    const pStatus = prettyPaymentStatus(payment.state)

    const session: PrettyPaymentSession = {
        sessionId: payment.sessionId,
        barcode: payment.barcode,
        paidDetail: payment.paidDetail,
        customerId: payment.customerId,
        orderContent: pOrder.data,
        state: pStatus,
        totalAmount: payment.totalAmount,
        boundTicketId: payment.boundTicketId
    }

    return {
        isSuccess: true,
        data: session,
    }
}
