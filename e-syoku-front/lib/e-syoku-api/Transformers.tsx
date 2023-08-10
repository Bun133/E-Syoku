import {PrettyOrder, TicketStatus} from "@/lib/e-syoku-api/Types";
import {ListItem} from "@chakra-ui/react";

export function orderDataTransform(orderData: PrettyOrder) {
    return orderData.map((order,index) => {
        return (
            <ListItem key={index}>
                {order.goods.name}×{order.count}個
            </ListItem>
        )
    })
}