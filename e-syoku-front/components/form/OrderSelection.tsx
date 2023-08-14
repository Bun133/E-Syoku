import {GoodsRemainData, GoodsWithRemainDataWaitingData, Order} from "@/lib/e-syoku-api/Types";
import {SimpleGrid, Spacer, Text} from "@chakra-ui/react";
import Goods from "@/components/goods";
import {useState} from "react";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export function OrderSelection(param: { goods: GoodsWithRemainDataWaitingData[], callBack: (order: Order) => void }) {
    const [listRefs, setListRefs] = useState<number[]>([])


    function isPossibleToEnd() {
        return listRefs.some(r => r > 0)
    }

    function generateOrder(): Order {
        return param.goods.map((g, index) => {
            return {
                goodsId: g.goods.goodsId,
                count: listRefs[index]
            }
        }).filter(o => o.count > 0)
    }


    return (
        <VStack>
            <Center>
                <SimpleGrid spacing={4} templateColumns={"repeat(2, 1fr)"} w={"100%"} h={"100%"} p={4}>
                    {param.goods.map((g, index) => {
                        return (
                            <Goods
                                goods={g.goods}
                                key={g.goods.goodsId}
                                waiting={g.waitingData}
                                footer={(
                                    <OrderSelectionFooter
                                        onChange={(to) => {
                                            const copy = listRefs.slice()
                                            copy[index] = to
                                            setListRefs(copy)
                                        }}
                                        remainData={g.remainData}/>
                                )}
                            />
                        )
                    })}
                </SimpleGrid>
            </Center>
            <Center>
                <Btn disabled={!isPossibleToEnd()} onClick={() => {
                    param.callBack(generateOrder())
                }}>決定</Btn>
            </Center>
        </VStack>
    )
}

export function OrderSelectionFooter(param: {
    onChange: (to: number) => void,
    max?: number,
    remainData: GoodsRemainData
}) {
    const [count, setCount] = useState(0)

    function isRemain(r: GoodsRemainData) {
        // @ts-ignore
        if (r.remain != undefined) {
            // @ts-ignore
            return r.remain
            // @ts-ignore
        } else if (r.remainCount != undefined) {
            // @ts-ignore
            return r.remainCount > 0
        }

        throw new Error("remain is not defined")
    }

    function isToExceed(r: GoodsRemainData, count: number) {
        // @ts-ignore
        if (r.remain != undefined) {
            // @ts-ignore
            return !r.remain
            // @ts-ignore
        } else if (r.remainCount != undefined) {
            // @ts-ignore
            return r.remainCount <= count
        }

        throw new Error("remain is not defined")
    }

    return (
        <HStack p={1}>
            <Btn onClick={() => {
                const toUpdate = Math.max(0, count - 1)
                setCount(toUpdate)
                param.onChange(toUpdate)
            }} disabled={!(isRemain(param.remainData) && count > 0)}>
                <Center>
                    <Text>-</Text>
                </Center>
            </Btn>
            <Spacer/>
            <Heading>{count}</Heading>
            <Spacer/>
            <Btn onClick={() => {
                let toUpdate
                if (param.max) toUpdate = Math.min(param.max, count + 1)
                else toUpdate = Math.max(0, count + 1)
                setCount(toUpdate)
                param.onChange(toUpdate)
            }} disabled={isToExceed(param.remainData, count)}>
                <Center>
                    <Text>+</Text>
                </Center>
            </Btn>
        </HStack>
    )
}