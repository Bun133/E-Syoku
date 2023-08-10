"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useSearchParams} from "next/navigation";
import React from "react";
import Btn from "@/components/btn";
import {Center, VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import { TicketCard } from "@/components/Ticket";
import {Container} from "@chakra-ui/react";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id") ?? undefined

    return (
        <>
            <APIEndpoint endpoint={ticketStatusEndPoint} query={{ticketId: id}}
                         refetch={{interval:30}}
                         onEnd={(response, reload) => {
                const ticket = response.data.ticket
                if (ticket !== undefined) {
                    return (
                        <>
                            <PageTitle title={"食券番号 " + ticket.ticketNum}></PageTitle>
                            <Container>
                                <TicketCard ticket={ticket}/>
                                <Center>
                                    <Btn onClick={() => reload()}>再読み込み</Btn>
                                </Center>
                            </Container>
                        </>
                    )
                } else {
                    return (
                        <div>
                            <PageTitle title={"食券が見つかりませんでした"}></PageTitle>
                            <div className={"flex flex-col items-center justify-center"}>
                                <div className={"font-bold text-xl"}>食券番号をご確認ください</div>
                            </div>
                        </div>
                    )
                }
            }}/>
        </>
    )
}