"use client"
import {callEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint, submitOrderEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Center, VStack} from "@chakra-ui/layout";
import {OrderSelection} from "@/components/form/OrderSelection";
import {useRef, useState} from "react";
import {Order} from "@/lib/e-syoku-api/Types";
import Goods from "@/components/goods";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {useDisclosure} from "@chakra-ui/hooks";
import {MessageModal} from "@/components/modal/MessageModal";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";

export default function Page() {
    const [order, setOrder] = useState<Order>()
    const auth = useFirebaseAuth()
    const {isOpen, onOpen, onClose} = useDisclosure()
    const message = useRef([""])

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
                                        return callEndpoint(submitOrderEndPoint, auth.user, {order: order}).then((d) => {
                                            message.current = ["Response:", JSON.stringify(d)]
                                            onOpen()
                                        })
                                    }}>注文を確定</Btn>
                                    <MessageModal message={message.current} isOpen={isOpen}
                                                  onClose={onClose}></MessageModal>
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