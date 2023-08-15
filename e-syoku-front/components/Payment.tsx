import {PrettyPaymentSession} from "@/lib/e-syoku-api/Types";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Center, VStack} from "@chakra-ui/layout";
import Barcode from "react-barcode";
import {Text, UnorderedList} from "@chakra-ui/react";
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
    )
}