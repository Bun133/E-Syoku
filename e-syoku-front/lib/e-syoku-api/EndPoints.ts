import {endpoint} from "@/lib/e-syoku-api/Axios";
import {z} from "zod";
import {
    authStateResponse,
    bindTicketResponse,
    callTicketResponse,
    cancelCallingResponse,
    defaultResponseFormat,
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
    resolveTicketResponse,
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
export const callTicketEndPoint = endpoint("callTicket", ticketSpecifyRequest, callTicketResponse)
export const cancelCallingEndPoint = endpoint("cancelCalling", ticketSpecifyRequest, cancelCallingResponse)
export const resolveTicketEndPoint = endpoint("resolveTicket", ticketSpecifyRequest, resolveTicketResponse)

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
    uid: uniqueId,
    barcode: z.string()
}), bindTicketResponse)

export const cmsTicketEndpoint = endpoint("cmsTicket", z.object({
    barcode: z.string().optional(),
    uid: z.string().optional(),
    ticketId: z.string().optional()
}), ticketResponse)