"use client"
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Container, Text} from "@chakra-ui/react";
import {useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, VStack} from "@chakra-ui/layout";
import {Loader} from "react-feather";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import QRCode from "react-qr-code";
import Btn from "@/components/btn";

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid")
    const paymentId = params.get("paymentId")
    const {response: data, firstCall, fetch: reload} = useLazyEndpoint(paymentStatusEndPoint)
    if (!uid || !paymentId) {
        return (
            <>
                <PageTitle title={"決済セッション:エラー"}/>
                <Container>
                    uid,paymentIdを指定してください
                </Container>
            </>
        )
    }

    if (!data) {
        firstCall({paymentId: paymentId, userId: uid})
        return (
            <>
                <PageTitle title={"決済セッション:読み込み中"}/>
                <Center>
                    <Loader/>
                </Center>
            </>
        )
    } else {
        if (data && data.data) {
            return (
                <>
                    <PageTitle title={"決済セッション:" + uid +":" + paymentId}/>
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
                            <Btn onClick={() => {
                                reload({paymentId: paymentId, userId: uid})
                            }}>再読み込み</Btn>
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
                        reload({paymentId: paymentId, userId: uid})
                    }}>再読み込み</Btn>
                </Center>
            </>
        )
    }
}