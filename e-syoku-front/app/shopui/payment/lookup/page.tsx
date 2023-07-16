"use client"
import {useRouter, useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Text} from "@chakra-ui/react";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, VStack} from "@chakra-ui/layout";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import QRCode from "react-qr-code";
import Btn from "@/components/btn";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid") ?? undefined
    const paymentId = params.get("paymentId") ?? undefined
    const router = useRouter()

    return (
        <>
            <PageTitle title={`決済セッション:${uid}:${paymentId}`}/>
            <APIEndpoint endpoint={paymentStatusEndPoint} query={{userId: uid, paymentId: paymentId}}
                         onEnd={(response, reload) => {
                             const payment = response.data.payment
                             return (
                                 <>
                                     <PageTitle title={"決済セッション:" + uid + ":" + paymentId}/>
                                     <Center>
                                         <VStack>
                                             <Card>
                                                 <CardHeader><Center><QRCode
                                                     value={payment.customerId + ":" + payment.sessionId}/></Center></CardHeader>
                                                 <CardBody>
                                                     <VStack>
                                                         <Text>
                                                             顧客UserId:{payment.customerId}
                                                         </Text>
                                                         <Text>決済セッション:{payment.sessionId}</Text>
                                                         <Text>
                                                             State:{payment.state}
                                                         </Text>
                                                         {payment.orderContent.map((item, index) => {
                                                             return (
                                                                 <Text key={index}>
                                                                     商品Id: {item.goodsId} ,個数:{item.count}
                                                                 </Text>
                                                             )
                                                         })}
                                                     </VStack>
                                                 </CardBody>
                                                 <CardFooter>
                                                     支払金額: {payment.totalAmount}円
                                                 </CardFooter>
                                             </Card>
                                             <Btn onClick={() => {
                                                 router.push(`/shopui/payment/pay?uid=${uid}&paymentId=${paymentId}`)
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