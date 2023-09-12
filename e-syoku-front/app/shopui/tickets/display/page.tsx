"use client"
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {listShopsEndPoint, ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useRouter} from "next/navigation";
import {VStack} from "@chakra-ui/react";
import {TicketDisplay} from "@/components/TicketDisplay";

export default function Page() {
    const router = useRouter()
    return (
        <>
            <APIEndpoint endpoint={listShopsEndPoint} query={{}} onEnd={(data) => {
                return (<VStack>
                    {data.data.shops.map((e) => {
                        return (
                            <APIEndpoint key={e.shopId} endpoint={ticketDisplayEndpoint} query={{shopId: e.shopId}}
                                         onEnd={(display) => {
                                             return <TicketDisplay tickets={display.data.tickets}/>
                                         }}/>
                        )
                    })}
                </VStack>)
            }}/>
        </>
    )
}