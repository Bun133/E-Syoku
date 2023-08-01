"use client"
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint, submitOrderEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Center, VStack} from "@chakra-ui/layout";
import {OrderSelection} from "@/components/form/OrderSelection";
import React, {useRef, useState} from "react";
import {Order} from "@/lib/e-syoku-api/Types";
import Goods from "@/components/goods";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {useDisclosure} from "@chakra-ui/hooks";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {useRouter} from "next/navigation";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export default function Page() {
    const [order, setOrder] = useState<Order>()
    const auth = useFirebaseAuth()
    const router = useRouter()
    const [error, setError] = useState<EndPointErrorResponse<any>>()

    return (
        <>
            {order !== undefined ? <PageTitle title={"注文確定画面"}></PageTitle> :
                <PageTitle title={"商品一覧"}></PageTitle>}
            <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response, reload) => {
                const itemsData = response.data
                if (order) {
                    return (
                        <>
                            <VStack>
                                {order.map((orderData, index) => {
                                    const item = itemsData.data.find((item) => item.key.goodsId === orderData.goodsId)
                                    if (!item) return null
                                    return (
                                        <Goods key={index} goods={item.key} footer={(<div>
                                            注文個数:{orderData.count}
                                        </div>)}></Goods>
                                    )
                                })}

                                <Center>
                                    <Btn onClick={async () => {
                                        const r = await callEndpoint(submitOrderEndPoint, auth.user, {order: order})
                                        if (r.isSuccess) {
                                            router.push(`/payment/id?id=${r.data.paymentSessionId}`)
                                        } else {
                                            setError(r)
                                        }
                                    }}>注文を確定</Btn>
                                    <APIErrorModal error={error}/>
                                </Center>
                            </VStack>
                        </>
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