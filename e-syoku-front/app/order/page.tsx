"use client"
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint, submitOrderEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Center, Divider, Heading, VStack} from "@chakra-ui/layout";
import {OrderSelection} from "@/components/form/OrderSelection";
import React, {useRef, useState} from "react";
import {Order} from "@/lib/e-syoku-api/Types";
import Goods from "@/components/goods";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {useRouter} from "next/navigation";
import {APIErrorModal} from "@/components/modal/APIErrorModal";
import {CardFooter} from "@chakra-ui/card";
import {Container, Flex, Spacer, Text} from "@chakra-ui/react";
import {Underline} from "react-feather";

export default function Page() {
    const [order, setOrder] = useState<Order>()
    const auth = useFirebaseAuth()
    const router = useRouter()
    const [error, setError] = useState<EndPointErrorResponse<any>>()
    const totalAmount = useRef(0)

    return (
        <>
            {order !== undefined ? <PageTitle title={"注文確定画面"}></PageTitle> :
                <PageTitle title={"商品一覧"}></PageTitle>}
            <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response, reload) => {
                const itemsData = response.data
                if (order) {
                    totalAmount.current = 0
                    return (
                        <Container>
                            <VStack>
                                {order.map((orderData, index) => {
                                    const item = itemsData.data.find((item) => item.goods.goodsId === orderData.goodsId)
                                    if (!item) return null
                                    totalAmount.current += item.goods.price * orderData.count
                                    return (
                                        <Goods key={index} goods={item.goods} footer={(
                                            <CardFooter>
                                                <VStack alignItems={"start"}>
                                                    <Text>注文数：{orderData.count}個</Text>
                                                    <Text>小計：{item.goods.price * orderData.count}円</Text>
                                                </VStack>
                                            </CardFooter>
                                        )}></Goods>
                                    )
                                })}

                                <Flex w={"100%"}>
                                    <Heading>合計金額：{totalAmount.current}円</Heading>
                                    <Spacer/>
                                    <Btn onClick={async () => {
                                        // TODO 読み込み中にボタンが一瞬押せる
                                        const r = await callEndpoint(submitOrderEndPoint, auth.user, {order: order})
                                        if (r.isSuccess) {
                                            router.push(`/payment/id?id=${r.data.paymentSessionId}`)
                                        } else {
                                            setError(r)
                                        }
                                    }}>注文を確定</Btn>
                                    <APIErrorModal error={error}/>
                                </Flex>
                            </VStack>
                        </Container>
                    )
                }

                return (
                    <OrderSelection goods={itemsData.data} callBack={(ord) => {
                        setOrder(ord)
                    }}></OrderSelection>
                )
            }}/>
        </>
    )
}