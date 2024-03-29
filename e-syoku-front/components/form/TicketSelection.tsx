import {PrettyTicket} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {TicketComponent} from "@/components/Ticket"
import {Box, Flex} from "@chakra-ui/react";
import {VStack} from "@chakra-ui/layout";

export function TicketSelection(props: {
    tickets: PrettyTicket[] | undefined,
    onSelect: (ticket: PrettyTicket) => void,
    // for customizing select button
    button?: (ticket: PrettyTicket) => ReactNode
}) {
    const button = props.button !== undefined ?
        ((ticket: PrettyTicket) => (<div onClick={() => props.onSelect(ticket)}>{props.button!!(ticket)}</div>))
        : ((ticket: PrettyTicket) => undefined)

    return (
        <VStack>
            {props.tickets !== undefined ? props.tickets.sort((a, b) => a.issueTime.utcSeconds - b.issueTime.utcSeconds).map((ticket: PrettyTicket) => {
                return (
                    <Box w={"full"} key={ticket.uniqueId}>
                        <TicketComponent
                            ticket={ticket}
                            button={button(ticket)}/>
                    </Box>
                )
            }) : null}
        </VStack>
    )
}
