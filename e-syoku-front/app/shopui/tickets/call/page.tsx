"use client"
import PageTitle from "@/components/pageTitle";
import {TicketSelection} from "@/components/form/TicketSelection";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listTicketsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {useRouter} from "next/navigation";
import Btn from "@/components/btn";

export default function Page() {
    const {response: data} = useEndpoint(listTicketsEndPoint, {})
    const router = useRouter()

    return (
        <div>
            <PageTitle title={"食券呼び出し"}></PageTitle>
            <TicketSelection tickets={data?.data?.tickets} onSelect={(ticket: Ticket) => {
                router.push("/shopui/tickets/call/id?id=" + ticket.uniqueId)
            }} button={() => (<Btn>呼び出し</Btn>)}></TicketSelection>
        </div>
    )
}