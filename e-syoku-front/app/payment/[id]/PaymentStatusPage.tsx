"use client"
import {useParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, VStack} from "@chakra-ui/layout";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Loader} from "react-feather";
import Btn from "@/components/btn";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Text} from "@chakra-ui/react";
import QRCode from "react-qr-code"

export function PaymentStatusPage() {
    const {id} = useParams()
    if (!id) {
        return (
            <>
                <PageTitle title={"IDが指定されていません"}></PageTitle>
                <Center><p>IDを指定してください</p></Center>
            </>
        )
    } else {
        const {response: data, isLoaded, fetch: reload} = useEndpoint(paymentStatusEndPoint, {paymentId: id})
        if (!isLoaded) {
            return (
                <>
                    <PageTitle title={"決済セッション:" + id}/>
                    <Center>
                        <Loader/>
                    </Center>
                </>
            )
        }
        if (data && data.data) {
            return (
                <>
                    <PageTitle title={"決済セッション:" + id}/>
                    <Center>
                        <VStack>
                            <Card>
                                <CardHeader><Center><QRCode
                                    value={data.data.payment.customerId + ":" + data.data.payment.sessionId}/></Center></CardHeader>
                                <CardBody>
                                    <VStack>
                                        <Text>
                                            顧客UserId:{data.data.payment.customerId}
                                        </Text>
                                        <Text>決済セッション:{data.data.payment.sessionId}</Text>
                                        <Text>
                                            State:{data.data.payment.state}
                                        </Text>
                                        {data.data.payment.orderContent.map((item, index) => {
                                            return (
                                                <Text key={index}>
                                                    商品Id: {item.goodsId} ,個数:{item.count}
                                                </Text>
                                            )
                                        })}
                                    </VStack>
                                </CardBody>
                                <CardFooter>
                                    支払金額: {data.data.payment.totalAmount}円
                                </CardFooter>
                            </Card>
                        </VStack>
                    </Center>
                </>
            )
        }
        return (
            <>
                <PageTitle title={"読み込みに失敗しました"}/>
                <Center>
                    <Btn onClick={() => {
                        reload()
                    }}>再読み込み</Btn>
                </Center>
            </>
        )
    }
}