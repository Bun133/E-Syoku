import {GoodsRemainData, GoodsWithRemainData, Order} from "@/lib/e-syoku-api/Types";
import {SimpleGrid, Spacer} from "@chakra-ui/react";
import Goods from "@/components/goods";
import {useRef, useState} from "react";
import {Heading, HStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export function OrderSelection(param: { goods: GoodsWithRemainData[], callBack: (order: Order) => void }) {
    const listRefs = useRef<number[]>([])

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


    return (
        <SimpleGrid spacing={4} templateColumns={"repeat(2, 1fr)"} w={"100%"} h={"100%"} p={4}>
            {param.goods.map((g, index) => {
                return (
                    <Goods goods={g.key}
                           footer={(
                               <OrderSelectionFooter onChange={(to) => {
                                   listRefs.current[index] = to
                               }}
                                                     isDisabled={!isRemain(g.value)}/>)}></Goods>
                )
            })}
        </SimpleGrid>
    )
}

export function OrderSelectionFooter(param: { onChange: (to: number) => void, max?: number, isDisabled: boolean }) {
    const [count, setCount] = useState(0)

    return (
        <HStack>
            <Btn onClick={() => {
                setCount(Math.max(0, count - 1))
                param.onChange(count)
            }} disabled={param.isDisabled}>-</Btn>
            <Spacer/>
            <Heading>{count}</Heading>
            <Spacer/>
            <Btn onClick={() => {
                if (param.max) setCount(Math.min(param.max, count + 1))
                else setCount(Math.max(0, count + 1))
                param.onChange(count)
            }} disabled={param.isDisabled}>+</Btn>
        </HStack>
    )
}