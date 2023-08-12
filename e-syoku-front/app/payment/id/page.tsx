"use client"
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, VStack} from "@chakra-ui/layout";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Text, UnorderedList} from "@chakra-ui/react";
import React from "react";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {orderDataTransform} from "@/lib/e-syoku-api/Transformers";
import Barcode from "react-barcode";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id") ?? undefined

    return (
        <>
            <PageTitle title={"決済セッション:" + id}/>
            <APIEndpoint endpoint={paymentStatusEndPoint} query={{paymentId: id}} onEnd={(response, reload) => {
                const payment = response.data.payment
                return (
                    <Center>
                        <VStack>
                            <Card>
                                <CardHeader><Center>
                                    <Barcode value={response.data.payment.barcode}/>
                                </Center></CardHeader>
                                <CardBody>
                                    <VStack>
                                        <Text>
                                            顧客UserId:{payment.customerId}
                                        </Text>
                                        <Text>決済セッション:{payment.sessionId}</Text>
                                        <Text>
                                            State:{payment.state}
                                        </Text>
                                        <UnorderedList>
                                            {orderDataTransform(payment.orderContent)}
                                        </UnorderedList>
                                    </VStack>
                                </CardBody>
                                <CardFooter>
                                    支払金額: {payment.totalAmount}円
                                </CardFooter>
                            </Card>
                            <Btn onClick={reload}>再読み込み</Btn>
                        </VStack>
                    </Center>
                )
            }}/>
        </>
    )
}