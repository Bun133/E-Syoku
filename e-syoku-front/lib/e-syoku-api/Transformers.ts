import {Order, TicketStatus} from "@/lib/e-syoku-api/Types";

export function ticketStatusTransform(status:TicketStatus){
    switch (status){
        case "PROCESSING":
            return "調理中"
        case "CALLED":
            return "呼び出し済み"
        case "INFORMED":
            return "お知らせあり"
        case "RESOLVED":
            return "受け取り済み"
    }
}

export function orderDataTransform(orderData:Order){
    return orderData.map(order => `[ID:${order.goodsId} ${order.count}個]`).join(",")
}