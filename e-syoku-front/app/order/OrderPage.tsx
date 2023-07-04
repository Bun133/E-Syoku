"use client"
import {callEndpoint, useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint, submitOrderEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Loader} from "react-feather";
import {Center, VStack} from "@chakra-ui/layout";
import {OrderSelection} from "@/components/form/OrderSelection";
import {useRef, useState} from "react";
import {Order} from "@/lib/e-syoku-api/Types";
import Goods from "@/components/goods";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {useDisclosure} from "@chakra-ui/hooks";
import MessageModal from "@/components/modal/MessageModal";

export function OrderPage() {
    const {response: itemsData} = useEndpoint(listGoodsEndPoint, {})
    const [order, setOrder] = useState<Order>()
    const auth = useFirebaseAuth()
    const {isOpen, onOpen, onClose} = useDisclosure()
    const message = useRef([""])

    if (order && itemsData) {
        return (
            <div>
                <PageTitle title={"注文確定画面"}></PageTitle>
                <VStack>
                    {order.map((orderData, index) => {
                        const item = itemsData.data?.data.find((item) => item.key.goodsId === orderData.goodsId)
                        if (!item) return null
                        return (
                            <Goods key={index} goods={item.key} footer={(<div>
                                注文個数:{orderData.count}
                            </div>)}></Goods>
                        )
                    })}

                    <Center>
                        <Btn onClick={() => {
                            callEndpoint(submitOrderEndPoint, auth, {order: order}).then((d) => {
                                message.current = ["Response:", JSON.stringify(d)]
                                onOpen()
                            })
                        }}>注文を確定</Btn>
                        <MessageModal message={message.current} isOpen={isOpen} onClose={onClose}></MessageModal>
                    </Center>
                </VStack>
            </div>
        )
    }

    if (itemsData) {
        if (itemsData.data == undefined) {
            return (
                <PageTitle title={"エラー"}></PageTitle>
            )
        }
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <OrderSelection goods={itemsData.data!.data} callBack={(ord) => {
                    setOrder(ord)
                }}></OrderSelection>
            </div>
        )

    } else {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <Center>
                    <Loader></Loader>
                </Center>
            </div>
        )
    }
}