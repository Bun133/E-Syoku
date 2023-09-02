import Btn from "@/components/btn";
import {PrettyTicket, PrettyTicketStatus} from "@/lib/e-syoku-api/Types";
import React, {ReactNode} from "react";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Badge, Box, Text, UnorderedList} from "@chakra-ui/react";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {orderDataTransform, utcSecToString} from "@/lib/e-syoku-api/Transformers";

export function ticketColor(status: PrettyTicketStatus): string {
    switch (status) {
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

function colorScheme(status: PrettyTicketStatus): string {
    switch (status) {
        case "お知らせ":
            return "cyan"
        case "受け取り待ち":
            return "green"
        case "完了":
            return "gray"
        case "注文済み":
        case "調理中":
            return "yellow"
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
                <Badge colorScheme={colorScheme(param.ticket.status)}>
                    <Text size={"xl"}>{param.ticket.status}</Text>
                </Badge>
                <Box backgroundColor={ticketColor(param.ticket.status)} px={4} py={2}>
                    <Center>
                        <Heading>
                            {param.ticket.ticketNum}
                        </Heading>
                    </Center>
                </Box>
            </CardHeader>
            <CardBody>
                <VStack align={"flex-start"}>
                    <Text>注文内容:</Text>
                    <UnorderedList>
                        {orderDataTransform(param.ticket.orderData)}
                    </UnorderedList>
                </VStack>
            </CardBody>
            <CardFooter>
                <VStack align={"flex-end"} w={"full"}>
                    {button}
                </VStack>
            </CardFooter>
        </Card>
    )
}

export function TicketCard(params: { ticket: PrettyTicket }) {
    return (
        <Card w={"full"}>

            <CardHeader>
                <Badge colorScheme={colorScheme(params.ticket.status)}>
                    <Text size={"xl"}>{params.ticket.status}</Text>
                </Badge>
                <Box backgroundColor={ticketColor(params.ticket.status)} px={4} py={2}>
                    <Center>
                        <Heading>
                            {params.ticket.ticketNum}
                        </Heading>
                    </Center>
                </Box>
            </CardHeader>


            <CardBody>
                <VStack align={"flex-start"}>
                    <Text>状態：{params.ticket.status}</Text>
                    <Text>購入店舗：{params.ticket.shop.name}</Text>
                    <Text>注文内容：</Text>
                    <Box pl={"1rem"}>
                        <UnorderedList>{orderDataTransform(params.ticket.orderData)}</UnorderedList>
                    </Box>

                    <Text>発行時刻：{utcSecToString(params.ticket.issueTime.utcSeconds)}</Text>
                </VStack>
            </CardBody>
        </Card>
    )
}