import {GoodsWithRemainDataWaitingData, Order} from "@/lib/e-syoku-api/Types";
import {Heading, VStack} from "@chakra-ui/layout";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Box, HStack, ModalContent, Spacer, Text} from "@chakra-ui/react";
import {Modal, ModalBody, ModalCloseButton, ModalFooter, ModalHeader, ModalOverlay} from "@chakra-ui/modal";
import {useDisclosure} from "@chakra-ui/hooks";
import {useState} from "react";
import Btn from "@/components/btn";

export function NOrderSelection(params: {
    goods: GoodsWithRemainDataWaitingData[],
    onOrder: (order: Order) => void
}) {
    const [orderMap, setOrderMap] = useState(new Map<string, number>())

    function updateOrderMap(key: string, count: number) {
        const newMap = new Map(orderMap)
        newMap.set(key, count)
        setOrderMap(newMap)
    }

    function generateOrder(): Order {
        const order: Order = []
        orderMap.forEach((count, key) => {
            if (count > 0) {
                order.push({
                    goodsId: key,
                    count: count
                })
            }
        })
        return order
    }

    function isDisabled(): boolean {
        const order = generateOrder()
        if (order.length === 0) {
            return true
        }
        return false
    }

    return (
        <VStack>
            {params.goods.map((g, i) => {
                return (
                    <Box>
                        <GoodsOrderCard goods={g} onUpdate={(count) => updateOrderMap(g.goods.goodsId, count)}/>
                    </Box>
                )
            })}

            <Btn onClick={() => params.onOrder(generateOrder())} disabled={isDisabled()}>注文を確定する</Btn>
        </VStack>
    )
}

function GoodsOrderCard(params: { goods: GoodsWithRemainDataWaitingData, onUpdate?: (count: number) => void }) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [count, setCount] = useState(0)

    function onCartAdd() {
        params.onUpdate?.(count)
        onClose()
    }

    return (
        <>
            <Card onClick={onOpen} cursor={"pointer"}>
                <CardHeader>
                    {params.goods.goods.name}
                </CardHeader>
                <CardBody>
                    <VStack alignItems={"flex-start"}>
                        <Text>{params.goods.goods.description}</Text>
                        <Text>金額:{params.goods.goods.price}</Text>
                        <Text>受け取り待ち人数:{params.goods.waitingData.waiting}</Text>
                    </VStack>
                </CardBody>
            </Card>

            <Modal size={"full"} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>
                        <ModalCloseButton/>
                    </ModalHeader>
                    <ModalBody>
                        <Heading>
                            {params.goods.goods.name}
                        </Heading>
                        <Text>
                            商品説明：{params.goods.goods.description}
                        </Text>
                        <Text>
                            価格：{params.goods.goods.price}
                        </Text>
                        <Text>
                            受け取り待ち人数：{params.goods.waitingData.waiting}
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <HStack>
                            <Heading>
                                小計：{params.goods.goods.price * count}円
                            </Heading>
                            <Spacer/>
                            <HStack>
                                <HStack>
                                    <Btn onClick={() => setCount(count - 1)}>-</Btn>
                                    <Text>{count}個</Text>
                                    <Btn onClick={() => setCount(count + 1)}>+</Btn>
                                </HStack>
                                <Box w={4}/>
                                <Btn onClick={onCartAdd}>カートに追加する</Btn>
                            </HStack>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}