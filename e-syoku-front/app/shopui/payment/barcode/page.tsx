"use client"
import {useSearchParams} from "next/navigation";
import {Grid, GridItem, Text} from "@chakra-ui/react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {VStack} from "@chakra-ui/layout";

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid")
    const ticketsId = params.getAll("ticketId")

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
                {ticketsId.map(e => TicketEntry({uid: uid, ticketId: e}))}
            </VStack>
        )
    }
}

function TicketEntry(params: { uid: string, ticketId: string }) {
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