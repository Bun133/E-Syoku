"use client"

import PageTitle from "@/components/pageTitle";
import Ticket from "@/components/Ticket";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";

export default function Page() {
    const {response: tickets, isLoaded} = useEndpoint(listTicketsEndPoint, {})

    if (!isLoaded) {
        return (
            <PageTitle title={"読み込み中"}></PageTitle>
        )
    }
    return (
        <div>
            <PageTitle title="食券一覧"></PageTitle>
            <div className="p-2 flex flex-col justify-items-start items-stretch space-y-2">
                {tickets !== undefined ? tickets.data?.tickets.map((ticket) => {
                    return (
                        <Ticket key={ticket.uniqueId} ticket={ticket}></Ticket>
                    )
                }) : null}
            </div>
        </div>
    )
}