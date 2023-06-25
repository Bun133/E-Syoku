"use client"

import PageTitle from "@/components/pageTitle";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Button from "@/components/button";
import {TicketSelection} from "@/components/form/TicketSelection";
import {Ticket} from "@/lib/e-syoku-api/Types";

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
            <TicketSelection tickets={tickets!!.data!!.tickets} onSelect={(ticket: Ticket) => {
                console.log("selected", ticket)
            }}></TicketSelection>

            <div className={"flex justify-center items-center p-2"}>
                <Button onClick={() => {
                    reload()
                }}>
                    再読み込み
                </Button>
            </div>
        </div>
    )
}