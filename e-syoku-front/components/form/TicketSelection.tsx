import {Ticket} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {default as TicketComponent} from "@/components/Ticket"
import {VStack} from "@chakra-ui/layout";

export function TicketSelection(props: {
    tickets: Ticket[] | undefined,
    onSelect: (ticket: Ticket) => void,
    // for customizing select button
    button?: (ticket: Ticket) => ReactNode
}) {
    const button = props.button !== undefined ?
        ((ticket: Ticket) => (<div onClick={() => props.onSelect(ticket)}>{props.button!!(ticket)}</div>))
        : ((ticket: Ticket) => undefined)

    return (
        <VStack>
            {props.tickets !== undefined ? props.tickets.map((ticket: Ticket) => {
                return (
                    <TicketComponent
                        key={ticket.uniqueId}
                        ticket={ticket}
                        button={button(ticket)}></TicketComponent>
                )
            }) : null}
        </VStack>
    )
}
