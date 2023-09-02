import {PrettyPaymentSession} from "@/lib/e-syoku-api/Types";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Center, HStack, VStack} from "@chakra-ui/layout";
import Barcode from "react-barcode";
import {Box, Spacer, Text, UnorderedList} from "@chakra-ui/react";
import {orderDataTransform} from "@/lib/e-syoku-api/Transformers";
import React from "react";

export function PaymentCard(params: { payment: PrettyPaymentSession }) {
    const payment = params.payment

    return (
        <Card>
            <CardHeader><Center>
                <Barcode value={payment.barcode}/>
            </Center></CardHeader>
            <CardBody>
                <VStack alignItems={"flex-start"}>
                    <Text>
                        状態:{payment.state}
                    </Text>
                    <Text>
                        注文内容：
                    </Text>
                    <HStack>
                        <Box w={"1rem"}/>
                        <UnorderedList>
                            {orderDataTransform(payment.orderContent)}
                        </UnorderedList>
                    </HStack>
                </VStack>
            </CardBody>
            <CardFooter>
                <HStack w={"full"}>
                    <Text fontSize={"2xl"}>支払金額： </Text>
                    <Spacer/>
                    <Text fontSize={"2xl"}>{payment.totalAmount}円</Text>
                </HStack>
            </CardFooter>
        </Card>
    )
}