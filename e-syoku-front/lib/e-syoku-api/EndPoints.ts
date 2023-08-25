import {endpoint} from "@/lib/e-syoku-api/Axios";
import {z} from "zod";
import {
    authStateResponse,
    bindTicketResponse,
    defaultResponseFormat,
    goodsRemainDataSchema,
    grantPermissionRequest,
    listGoodsResponse,
    listPaymentResponse,
    listShopResponse,
    listTicketResponse,
    markPaymentPaidRequest,
    orderSchema,
    paidResponse,
    paymentIdRequest,
    paymentStatusResponse,
    prettyGoodsSchema,
    submitOrderResponse,
    ticketDisplayResponse,
    ticketIdRequest,
    ticketResponse,
    ticketSpecifyRequest,
    uniqueId
} from "@/lib/e-syoku-api/Types";

export const ticketStatusEndPoint = endpoint("ticketStatus", ticketIdRequest, ticketResponse)
export const listTicketsEndPoint = endpoint("listTickets", z.object({}), listTicketResponse)
export const listShopsEndPoint = endpoint("listShops", z.object({}), listShopResponse)
export const callTicketEndPoint = endpoint("callTicket", ticketSpecifyRequest, ticketResponse)
export const cancelCallingEndPoint = endpoint("cancelCalling", ticketSpecifyRequest, ticketResponse)
export const resolveTicketEndPoint = endpoint("resolveTicket", ticketSpecifyRequest, ticketResponse)

export const listGoodsEndPoint = endpoint("listGoods", z.object({}), listGoodsResponse)

export const submitOrderEndPoint = endpoint("submitOrder", z.object({order: orderSchema}), submitOrderResponse)

export const listPaymentsEndPoint = endpoint("listPayments", z.object({}), listPaymentResponse)

export const paymentStatusEndPoint = endpoint("paymentStatus", paymentIdRequest, paymentStatusResponse)

export const markPaymentPaidEndpoint = endpoint("markPaymentPaid", markPaymentPaidRequest, paidResponse)

export const ticketDisplayEndpoint = endpoint("ticketDisplay", z.object({shopId: uniqueId}), ticketDisplayResponse)

export const authStateEndpoint = endpoint("authState", z.object({}), authStateResponse)

export const grantPermissionEndpoint = endpoint("grantPermission", grantPermissionRequest, defaultResponseFormat)

export const bindBarcodeEndpoint = endpoint("bindBarcode", z.object({
    ticketId: uniqueId.array().nonempty(),
    barcode: z.string()
}), bindTicketResponse)

export const cmsTicketEndpoint = endpoint("cmsTicket", z.object({
    barcode: z.string().optional(),
    uid: z.string().optional(),
    ticketId: z.string().optional()
}), ticketResponse)

export const listenNotificationEndpoint = endpoint("listenNotification", z.object({token: z.string()}), defaultResponseFormat)

export const callTicketStackEndpoint = endpoint("callTicketStack", z.object({
    shopId: uniqueId,
    count: z.number()
}), defaultResponseFormat)

export const cmsRemainEndpoint = endpoint("cmsRemain", z.object({}).or(z.object({
    op: z.literal("add").or(z.literal("set")),
    goodsId: uniqueId,
    amount: z.number()
})), defaultResponseFormat.and(z.object({
    remainData: z.object({
        goods: prettyGoodsSchema,
        remain: goodsRemainDataSchema
    }).array().optional()
})))