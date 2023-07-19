import {GoodsRemainData, GoodsWithRemainData, Order} from "@/lib/e-syoku-api/Types";
import {SimpleGrid, Spacer} from "@chakra-ui/react";
import Goods from "@/components/goods";
import {useState} from "react";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export function OrderSelection(param: { goods: GoodsWithRemainData[], callBack: (order: Order) => void }) {
    const [listRefs, setListRefs] = useState<number[]>([])

    function isRemain(r: GoodsRemainData) {
        // @ts-ignore
        if (r.remain != undefined) {
            // @ts-ignore
            return r.remain
            // @ts-ignore
        } else if (r.remainCount != undefined) {
            // @ts-ignore
            return r.remainCount
        }

        throw new Error("remain is not defined")
    }

    function isPossibleToEnd() {
        return listRefs.some(r => r > 0)
    }

    function generateOrder(): Order {
        return param.goods.map((g, index) => {
            return {
                goodsId: g.key.goodsId,
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
                            <Goods goods={g.key} key={g.key.goodsId}
                                   footer={(
                                       <OrderSelectionFooter onChange={(to) => {
                                           const copy = listRefs.slice()
                                           copy[index] = to
                                           setListRefs(copy)
                                       }}
                                                             isDisabled={!isRemain(g.value)}/>)}></Goods>
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

export function OrderSelectionFooter(param: { onChange: (to: number) => void, max?: number, isDisabled: boolean }) {
    const [count, setCount] = useState(0)

    return (
        <HStack>
            <Btn onClick={() => {
                const toUpdate = Math.max(0, count - 1)
                setCount(toUpdate)
                param.onChange(toUpdate)
            }} disabled={param.isDisabled}>-</Btn>
            <Spacer/>
            <Heading>{count}</Heading>
            <Spacer/>
            <Btn onClick={() => {
                let toUpdate
                if (param.max) toUpdate = Math.min(param.max, count + 1)
                else toUpdate = Math.max(0, count + 1)
                setCount(toUpdate)
                param.onChange(toUpdate)
            }} disabled={param.isDisabled}>+</Btn>
        </HStack>
    )
}