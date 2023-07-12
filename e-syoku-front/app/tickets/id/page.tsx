"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useSearchParams} from "next/navigation";
import React from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import Btn from "@/components/btn";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {Loader} from "react-feather";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Box, Text} from "@chakra-ui/react";
import {orderDataTransform, ticketStatusTransform} from "@/lib/e-syoku-api/Transformers";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id")
    const {response: data, isLoaded, fetch: reload} = useEndpoint(ticketStatusEndPoint, {ticketId: id})
    if (id === null) {
        return (
            <>
                <PageTitle title={"エラー"}></PageTitle>
                <Center>
                    <Heading>IDが指定されていません</Heading>
                </Center>
            </>
        )
    }

    const ticket = data?.data?.ticket

    if (!isLoaded) {
        return (
            <div>
                <PageTitle title={"読み込み中"}></PageTitle>
                <Center>
                    <Loader/>
                </Center>
            </div>
        )
    }

    if (ticket !== undefined) {
        return (
            <>
                <PageTitle title={"食券番号 " + ticket.ticketNum}></PageTitle>
                <VStack>
                    <Card>

                        <Box backgroundColor={"gray.200"} borderRadius={10} mx={4} my={1}>
                            <Center>
                                <CardHeader><Heading>{ticket.ticketNum}</Heading></CardHeader>
                            </Center>
                        </Box>


                        <CardBody>
                            <VStack>
                                <Text>Status : {ticketStatusTransform(ticket.status)}</Text>
                                <Text>UniqueId : {ticket.uniqueId}</Text>
                                <Text>ShopId : {ticket.shopId}</Text>
                                <Text>PaymentSessionId :{ticket.paymentSessionId}</Text>
                                <Text>OrderData :{orderDataTransform(ticket.orderData)}</Text>
                                {/**TODO 時刻表示**/}
                                <Text>IssueTime :{ticket.issueTime._seconds}</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                    <Center>
                        <Btn onClick={() => reload()}>再読み込み</Btn>
                    </Center>
                </VStack>
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
}