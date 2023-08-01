"use client"
import {useSearchParams} from "next/navigation";
import {Code, Grid, GridItem, Text} from "@chakra-ui/react";
import {callEndpoint, EndPointErrorResponse, useEndpoint} from "@/lib/e-syoku-api/Axios";
import {bindBarcodeEndpoint, ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {VStack} from "@chakra-ui/layout";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import React, {useRef, useState} from "react";
import {MessageModal} from "@/components/modal/MessageModal";
import {useDisclosure} from "@chakra-ui/hooks";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

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
            </VStack>
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