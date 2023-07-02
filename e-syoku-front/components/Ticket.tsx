import Btn from "@/components/btn";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {Heading, VStack} from "@chakra-ui/layout";


export default function TicketComponent(param: {
    ticket: Ticket,
    button?: ReactNode
}) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/tickets/" + param.ticket.uniqueId}>
            詳しく見る
        </Btn>);


    return (
        <VStack>
            <VStack>
                <Heading>{param.ticket.ticketNum}</Heading>
            </VStack>

            <VStack>
                {param.ticket.status}
                <div className={"w-2"}></div>
                {button}
            </VStack>
        </VStack>
    )
}