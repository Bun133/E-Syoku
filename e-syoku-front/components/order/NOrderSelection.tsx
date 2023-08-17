import {GoodsRemainData, GoodsWithRemainDataWaitingData, Order} from "@/lib/e-syoku-api/Types";
import {AspectRatio, Heading, VStack} from "@chakra-ui/layout";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Box, HStack, ModalContent, SimpleGrid, Text} from "@chakra-ui/react";
import {Modal, ModalBody, ModalCloseButton, ModalFooter, ModalHeader, ModalOverlay} from "@chakra-ui/modal";
import {useDisclosure} from "@chakra-ui/hooks";
import {useState} from "react";
import Btn from "@/components/btn";
import {StorageImage} from "@/lib/firebase/storage";

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
            <SimpleGrid columns={2} spacing={10}>
                {params.goods.map((g, i) => {
                    return (
                        <Box key={i}>
                            <GoodsOrderCard goods={g} onUpdate={(count) => updateOrderMap(g.goods.goodsId, count)}/>
                        </Box>
                    )
                })}
            </SimpleGrid>

            <Btn onClick={() => params.onOrder(generateOrder())} disabled={isDisabled()}>注文を確定する</Btn>
        </VStack>
    )
}

function GoodsOrderCard(params: { goods: GoodsWithRemainDataWaitingData, onUpdate?: (count: number) => void }) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [count, setCount] = useState<number>(0)

    function onCartAdd() {
        params.onUpdate?.(count)
        onClose()
    }

    function addButtonDisabled() {
        const toUpdate = count + 1
        if (isExceed(params.goods.remainData, toUpdate)) {
            return true
        }
        return false
    }

    function reduceButtonDisabled() {
        return count <= 0
    }

    function isExceed(r: GoodsRemainData, count: number) {
        // @ts-ignore
        if (r.remain != undefined) {
            // @ts-ignore
            return !r.remain
            // @ts-ignore
        } else if (r.remainCount != undefined) {
            // @ts-ignore
            return r.remainCount < count
        }

        throw new Error("remain is not defined")
    }

    return (
        <>
            <Card onClick={onOpen} cursor={"pointer"}>
                {
                    params.goods.goods.imageRefPath && (
                        <CardHeader>
                            <AspectRatio ratio={1}>
                                <StorageImage storagePath={params.goods.goods.imageRefPath} alt={params.goods.goods.name}/>
                            </AspectRatio>
                        </CardHeader>
                    )
                }
                <CardBody>
                    <VStack alignItems={"flex-start"}>
                        <Text>{params.goods.goods.name}</Text>
                        {count > 0 && <Text>注文個数: {count}</Text>}
                    </VStack>
                </CardBody>
            </Card>

            <Modal size={"full"} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalCloseButton/>
                    {
                        params.goods.goods.imageRefPath && (
                            <ModalHeader>
                                <AspectRatio ratio={1}>
                                    <StorageImage storagePath={params.goods.goods.imageRefPath}
                                                  alt={params.goods.goods.name}/>
                                </AspectRatio>
                            </ModalHeader>
                        )
                    }
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
                        <VStack alignItems={"flex-end"}>
                            <Heading>
                                小計：{params.goods.goods.price * count}円
                            </Heading>
                            <HStack>
                                <Btn onClick={() => setCount(count - 1)} disabled={reduceButtonDisabled()}>-</Btn>
                                <Text>{count}個</Text>
                                <Btn onClick={() => setCount(count + 1)} disabled={addButtonDisabled()}>+</Btn>
                            </HStack>
                            <Btn onClick={onCartAdd}>カートに追加する</Btn>
                        </VStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}