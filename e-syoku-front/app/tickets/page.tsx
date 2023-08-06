"use client"

import PageTitle from "@/components/pageTitle";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";
import {TicketSelection} from "@/components/form/TicketSelection";
import {PrettyTicket, Ticket} from "@/lib/e-syoku-api/Types";
import {VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";

export default function Page() {
    return (
        <>
            <PageTitle title="食券一覧"></PageTitle>
            <APIEndpoint endpoint={listTicketsEndPoint} query={{}} onEnd={(response, reload) => {
                return (
                    <VStack>
                        <TicketSelection tickets={response.data.tickets} onSelect={(ticket: PrettyTicket) => {
                            console.log("selected", ticket)
                        }}></TicketSelection>

                        <Btn onClick={reload}>
                            再読み込み
                        </Btn>
                    </VStack>
                )
            }}/>
        </>
    )
}