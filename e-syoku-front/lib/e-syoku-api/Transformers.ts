import {PrettyOrder, TicketStatus} from "@/lib/e-syoku-api/Types";

export function orderDataTransform(orderData: PrettyOrder) {
    return orderData.map(order => `[${order.goods.name} ${order.count}個]`).join(",")
}