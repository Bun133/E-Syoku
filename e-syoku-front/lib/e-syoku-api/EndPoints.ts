import {endpoint} from "@/lib/e-syoku-api/Axios";
import {z} from "zod";
import {
    callTicketResponse,
    cancelCallingResponse, defaultResponseFormat,
    listGoodsResponse,
    listPaymentResponse,
    listShopResponse,
    listTicketResponse, markPaymentPaidRequest,
    orderSchema,
    paymentIdRequest,
    paymentStatusResponse,
    resolveTicketResponse,
    submitOrderResponse,
    ticketIdRequest,
    ticketStatusResponse
} from "@/lib/e-syoku-api/Types";

export const ticketStatusEndPoint = endpoint("ticketStatus", ticketIdRequest, ticketStatusResponse)
export const listTicketsEndPoint = endpoint("listTickets", z.object({}), listTicketResponse)
export const listShopsEndPoint = endpoint("listShops", z.object({}), listShopResponse)
export const callTicketEndPoint = endpoint("callTicket", ticketIdRequest, callTicketResponse)
export const cancelCallingEndPoint = endpoint("cancelCalling", ticketIdRequest, cancelCallingResponse)
export const resolveTicketEndPoint = endpoint("resolveTicket", ticketIdRequest, resolveTicketResponse)

export const listGoodsEndPoint = endpoint("listGoods", z.object({}), listGoodsResponse)

export const submitOrderEndPoint = endpoint("submitOrder", z.object({order: orderSchema}), submitOrderResponse)

export const listPaymentsEndPoint = endpoint("listPayments", z.object({}), listPaymentResponse)

export const paymentStatusEndPoint = endpoint("paymentStatus", paymentIdRequest, paymentStatusResponse)

export const markPaymentPaidEndpoint = endpoint("markPaymentPaid", markPaymentPaidRequest, defaultResponseFormat)