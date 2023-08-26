"use client"
import {useSearchParams} from "next/navigation";
import {Box, Flex, Spacer, Text} from "@chakra-ui/react";
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {bindBarcodeEndpoint, ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {HStack, VStack} from "@chakra-ui/layout";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import React, {useState} from "react";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";
import Btn from "@/components/btn";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";

type BindStatus = {
    ticketId: string,
    isBound: boolean
}

export default function Page() {
    const params = useSearchParams()
    const ticketsId = params.getAll("ticketId")

    const token = useFirebaseAuth()

    const [status, setStatus] = useState<BindStatus[]>(ticketsId.map(id => ({ticketId: id, isBound: false})))
    const isAllBound = status.filter(s => !s.isBound).length == 0

    const [error, setError] = useState<EndPointErrorResponse<any>>()

    if (ticketsId.length == 0) {
        return (
            <Text>
                ticketIdを正しく指定してください
            </Text>
        )
    } else {
        return (
            <Flex direction={"column"} h={"max"}>
                <VStack>
                    <BarcodeReader onRead={async (e) => {
                        const res = await callEndpoint(bindBarcodeEndpoint, await token.waitForUser(), {
                            barcode: e,
                            ticketId: status.filter(s => !s.isBound).map(s => s.ticketId)
                        })

                        if (res.isSuccess) {
                            const newStatus = status.map(s => {
                                if (s.ticketId === res.data.boundTicketId) {
                                    return {...s, isBound: true}
                                } else {
                                    return s
                                }
                            })
                            setStatus(newStatus)
                        } else {
                            setError(res)
                        }
                    }} placeholder={"バーコードを読み取ってください"} autoSelect={true}/>
                    <APIErrorModal error={error}/>
                    <VStack w={"full"}>
                        {status.map(s => {
                            return (
                                <HStack key={s.ticketId} w={"full"} borderWidth={2} borderColor={"black.300"} p={2}
                                        backgroundColor={s.isBound ? "green.100" : "red.100"}>
                                    <TicketIdComponent ticketId={s.ticketId}/>
                                    <Spacer/>
                                    {s.isBound ? <Text color={"green"}>紐づけ済み</Text> :
                                        <Text color={"red"}>紐づけ前</Text>}
                                </HStack>
                            )
                        })}
                    </VStack>
                </VStack>

                <Box h={"1rem"}/>

                <VStack>
                    <Btn disabled={!isAllBound} href={"/shopui/payment/scan"}>決済処理の最初に戻る</Btn>
                </VStack>
            </Flex>
        )
    }
}

function TicketIdComponent(params: { ticketId: string }) {
    return (
        <APIEndpoint endpoint={ticketStatusEndPoint} query={{ticketId: params.ticketId}} onEnd={(response) => {
            const ticket = response.data.ticket
            return (
                <HStack>
                    <Text>{ticket.ticketNum}</Text>
                    <Spacer/>
                    <Text>{ticket.shop.name}</Text>
                </HStack>
            )
        }} loading={() => {
            return (
                <Text>{params.ticketId}</Text>
            )
        }}/>
    )
}