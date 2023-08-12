"use client"
import {useRouter, useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Text, UnorderedList} from "@chakra-ui/react";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, VStack} from "@chakra-ui/layout";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import Btn from "@/components/btn";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {orderDataTransform} from "@/lib/e-syoku-api/Transformers";
import Barcode from "react-barcode";
import React from "react";

export default function Page() {
    const params = useSearchParams()
    const paymentId = params.get("paymentId") ?? undefined
    const barcode = params.get("barcode") ?? undefined
    const router = useRouter()

    return (
        <>
            <APIEndpoint endpoint={paymentStatusEndPoint} query={{paymentId: paymentId, barcode: barcode}}
                         onEnd={(response, reload) => {
                             const payment = response.data.payment
                             return (
                                 <>
                                     <PageTitle title={`決済セッション:${payment.sessionId}`}/>
                                     <Center>
                                         <VStack>
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
                                             <Btn onClick={() => {
                                                 router.push(`/shopui/payment/pay?paymentId=${paymentId}`)
                                             }}>決済取扱い</Btn>
                                             <Btn onClick={reload}>再読み込み</Btn>
                                         </VStack>
                                     </Center>
                                 </>
                             )
                         }}/>
        </>
    )
}