import {
    Order,
    PrettyGoods,
    PrettyOrder,
    PrettySingleOrder,
    PrettyTicket,
    PrettyTicketStatus,
    PrettyTimeStamp,
    ShopDetail,
    Ticket,
    TicketStatus,
    TimeStamp
} from "@/lib/e-syoku-api/Types";
import {ListItem} from "@chakra-ui/react";

export function orderDataTransform(orderData: PrettyOrder) {
    return orderData.map((order, index) => {
        return (
            <ListItem key={index}>
                {order.goods.name}×{order.count}個
            </ListItem>
        )
    })
}


export function utcSecToString(utcSec: number) {
    const date = new Date(utcSec * 1000);
    return date.toLocaleString();
}

export function pretty(ticket: Ticket, goodsData: PrettyGoods[], shopData: ShopDetail[]): PrettyTicket | undefined {
    const shop = shopData.find(e => e.shopId === ticket.shopId)
    const order = prettyOrder(goodsData, ticket.orderData)
    if (!shop) return undefined
    if (!order) return undefined
    return {
        customerId: ticket.customerId,
        paymentSessionId: ticket.paymentSessionId,
        ticketNum: ticket.ticketNum,
        uniqueId: ticket.uniqueId,
        issueTime: prettyTimeStamp(ticket.issueTime),
        lastStatusUpdated: prettyTimeStamp(ticket.lastStatusUpdated),
        status: prettyStatus(ticket.status),
        shop: shop,
        orderData: order
    }
}

function prettyOrder(goodsData: PrettyGoods[], orderData: Order): PrettyOrder | undefined {
    const list: PrettySingleOrder[] = []
    for (const order of orderData) {
        const goods = goodsData.find(e => e.goodsId === order.goodsId)
        if (!goods) return undefined
        list.push({
            goods: goods,
            count: order.count,
        })
    }

    return list
}

function prettyTimeStamp(timeStamp: TimeStamp): PrettyTimeStamp {
    const sec = timeStamp._seconds
    const nanosec = timeStamp._nanoseconds

    const utcSec = sec + nanosec / 1000000000

    return {
        utcSeconds: utcSec
    }
}

function prettyStatus(status: TicketStatus): PrettyTicketStatus {
    switch (status) {
        case "PROCESSING":
            return "注文済み"
        case "CALLED":
            return "受け取り待ち"
        case "RESOLVED":
            return "完了"
        case "INFORMED":
            return "お知らせ"
    }
}