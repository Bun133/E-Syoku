import Btn from "@/components/btn";
import {PrettyTicket} from "@/lib/e-syoku-api/Types";
import React, {ReactNode} from "react";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Box, Text} from "@chakra-ui/react";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {orderDataTransform} from "@/lib/e-syoku-api/Transformers";

function ticketColor(ticket: PrettyTicket): string {
    switch (ticket.status) {
        case "お知らせ":
            return "cyan.300"
        case "受け取り待ち":
            return "green.300"
        case "完了":
            return "gray.300"
        case "注文済み":
        case "調理中":
            return "yellow.100"
    }
}

export function TicketComponent(param: {
    ticket: PrettyTicket,
    button?: ReactNode
}) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/tickets/id?id=" + param.ticket.uniqueId}>
            詳しく見る
        </Btn>);


    return (
        <Card>
            <CardHeader>
                <Box backgroundColor={ticketColor(param.ticket)} borderRadius={10} px={4} py={1}>
                    <Center>
                        <Heading>
                            {param.ticket.ticketNum}
                        </Heading>
                    </Center>
                </Box>
            </CardHeader>
            <CardBody>
                注文内容:{orderDataTransform(param.ticket.orderData)}
            </CardBody>
            <CardFooter>
                {button}
            </CardFooter>
        </Card>
    )
}

export function TicketCard(params: { ticket: PrettyTicket }) {
    return (
        <Card>

            <Box backgroundColor={ticketColor(params.ticket)} borderRadius={10} mx={4} my={1}>
                <Center>
                    <CardHeader><Heading>{params.ticket.ticketNum}</Heading></CardHeader>
                </Center>
            </Box>


            <CardBody>
                <VStack>
                    <Text>Status : {params.ticket.status}</Text>
                    <Text>UniqueId : {params.ticket.uniqueId}</Text>
                    <Text>Shop : {params.ticket.shop.name}</Text>
                    <Text>PaymentSessionId :{params.ticket.paymentSessionId}</Text>
                    <Text>OrderData :{orderDataTransform(params.ticket.orderData)}</Text>
                    {/**TODO 時刻表示**/}
                    <Text>IssueTime :{params.ticket.issueTime.utcSeconds}</Text>
                </VStack>
            </CardBody>
        </Card>
    )
}