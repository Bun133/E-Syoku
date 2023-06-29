"use client"
import PageTitle from "@/components/pageTitle";
import {TicketSelection} from "@/components/form/TicketSelection";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {useRouter} from "next/navigation";
import Button from "@/components/button";

export default function () {
    const {response: data} = useEndpoint(listTicketsEndPoint, {})
    const router = useRouter()

    return (
        <div>
            <PageTitle title={"食券呼び出し"}></PageTitle>
            <TicketSelection tickets={data?.data?.tickets} onSelect={(ticket: Ticket) => {
                router.push("/shopui/tickets/call/" + ticket.uniqueId)
            }} button={() => (<Button>呼び出し</Button>)}></TicketSelection>
        </div>
    )
}