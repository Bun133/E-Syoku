"use client"

import PageTitle from "@/components/pageTitle";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";
import {TicketSelection} from "@/components/form/TicketSelection";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {Center} from "@chakra-ui/layout";

export default function Page() {
    const {response: tickets, isLoaded, fetch: reload} = useEndpoint(listTicketsEndPoint, {})

    if (!isLoaded) {
        return (
            <PageTitle title={"読み込み中"}></PageTitle>
        )
    }
    return (
        <div>
            <PageTitle title="食券一覧"></PageTitle>
            <Center>
                <TicketSelection tickets={tickets!!.data!!.tickets} onSelect={(ticket: Ticket) => {
                    console.log("selected", ticket)
                }}></TicketSelection>

                <Btn onClick={() => {
                    reload()
                }}>
                    再読み込み
                </Btn>
            </Center>
        </div>
    )
}