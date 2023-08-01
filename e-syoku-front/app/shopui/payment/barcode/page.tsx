"use client"
import {useSearchParams} from "next/navigation";
import {Flex, Grid, GridItem, Spacer, Text} from "@chakra-ui/react";
import {callEndpoint, EndPointErrorResponse, useEndpoint} from "@/lib/e-syoku-api/Axios";
import {bindBarcodeEndpoint, ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {HStack, VStack} from "@chakra-ui/layout";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import React, {useState} from "react";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";
import Btn from "@/components/btn";

type BindStatus = {
    ticketId: string,
    isBound: boolean
}

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid")
    const ticketsId = params.getAll("ticketId")

    const token = useFirebaseAuth()

    const [status, setStatus] = useState<BindStatus[]>(ticketsId.map(id => ({ticketId: id, isBound: false})))
    const isAllBound = status.filter(s => !s.isBound).length == 0

    const [error, setError] = useState<EndPointErrorResponse<any>>()

    if (uid === null || ticketsId.length == 0) {
        return (
            <Text>
                uid,ticketIdを正しく指定してください
            </Text>
        )
    } else {

        // TODO もっとましにする
        return (
            <Flex direction={"column"} h={"max"}>
                <VStack>
                    <BarcodeReader onRead={async (e) => {
                        const res = await callEndpoint(bindBarcodeEndpoint, token.user, {
                            barcode: e,
                            uid: uid,
                            ticketId: ticketsId
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
                    <VStack>
                        {status.map(s => {
                            return (
                                <HStack>
                                    <Text>{s.ticketId}</Text>
                                    <Spacer/>
                                    {s.isBound ? <Text color={"green"}>紐づけ済み</Text> :
                                        <Text color={"red"}>紐づけ前</Text>}
                                </HStack>
                            )
                        })}
                    </VStack>
                </VStack>

                <Spacer/>

                <VStack>
                    <Btn disabled={!isAllBound} href={"/shopui/payment/scan"}>決済処理の最初に戻る</Btn>
                </VStack>
            </Flex>
        )
    }
}

function TicketEntry(params: {
    uid: string,
    ticketId: string
}) {
    const {response: data} = useEndpoint(ticketStatusEndPoint, {uid: params.uid, ticketId: params.ticketId})
    if (data) {
        if (data.isSuccess) {
            if (data.data.ticket) {
                return (
                    <Grid templateColumns="repeat(5,1fr)">
                        <GridItem>
                            {data.data.ticket.ticketNum}
                        </GridItem>
                        <GridItem>
                            {data.data.ticket.shopId}
                        </GridItem>
                        <GridItem>
                            {data.data.ticket.uniqueId}
                        </GridItem>
                    </Grid>
                )
            } else {
                return (
                    <Text>該当するチケットが見つかりませんでした</Text>
                )
            }
        }
    }
}