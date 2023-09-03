import {GoodsRemainData, GoodsWithRemainDataWaitingData, Order} from "@/lib/e-syoku-api/Types";
import {AspectRatio, Heading, VStack} from "@chakra-ui/layout";
import {Card, CardBody} from "@chakra-ui/card";
import {Box, HStack, ModalContent, ModalHeader, Text, Wrap, WrapItem} from "@chakra-ui/react";
import {Modal, ModalBody, ModalCloseButton, ModalFooter, ModalOverlay} from "@chakra-ui/modal";
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
        <VStack w={"full"} h={"full"}>
            <Wrap justify={"center"}>
                {params.goods.map((g, i) => {
                    return (
                        <WrapItem key={i} w={"calc(min(20rem,90dvw))"} p={2}>
                            <GoodsOrderCard goods={g}
                                            onUpdate={(count) => updateOrderMap(g.goods.goodsId, count)}/>
                        </WrapItem>
                    )
                })}
            </Wrap>

            <Btn onClick={() => params.onOrder(generateOrder())} disabled={isDisabled()}>注文を確定する</Btn>
        </VStack>
    )
}

// 一度に注文できる最大数
const maximumOrderCount = 5

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
        return isExceedRemainData(r, count) || maximumOrderCount < count
    }

    function isExceedRemainData(r: GoodsRemainData, count: number) {
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
        <Box w={"full"}>
            <Card onClick={onOpen} cursor={"pointer"}>
                {
                    params.goods.goods.imageRefPath && (
                        <AspectRatio ratio={1}>
                            <StorageImage storagePath={params.goods.goods.imageRefPath} alt={params.goods.goods.name}/>
                        </AspectRatio>
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
                    <ModalHeader>
                        <Text>商品追加</Text>
                    </ModalHeader>
                    <ModalBody>
                        {
                            params.goods.goods.imageRefPath && (
                                <AspectRatio ratio={1}>
                                    <StorageImage storagePath={params.goods.goods.imageRefPath}
                                                  alt={params.goods.goods.name}/>
                                </AspectRatio>
                            )
                        }
                        <Heading>
                            {params.goods.goods.name}
                        </Heading>
                        <Text>
                            商品説明：{params.goods.goods.description}
                        </Text>
                        <Text>
                            価格：{params.goods.goods.price}円
                        </Text>
                        <Text>
                            受け取り待ち人数：{params.goods.waitingData.waiting}人
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
        </Box>
    )
}