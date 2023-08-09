"use client"

import {useSearchParams} from "next/navigation";
import {Flex, Spacer, Text} from "@chakra-ui/react";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {callTicketStackEndpoint, ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {TicketDisplay} from "@/components/TicketDisplay";
import Btn from "@/components/btn";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import {useRef, useState} from "react";
import {useLazyEndpoint} from "@/lib/e-syoku-api/Axios";

const initialCount = 10

export default function Page() {
    const params = useSearchParams()
    const shopId = params.get("shopId") ?? undefined
    const callCount = useRef(initialCount)
    const {fetch} = useLazyEndpoint(callTicketStackEndpoint)

    async function autoCall() {
        if (shopId == undefined) {
            return
        }
        const r = await fetch({
            shopId: shopId,
            count: callCount.current
        })
    }


    return (
        <Flex w={"100%"} h={"100%"}>
            <VStack flexGrow={1}>
                <Heading>食券一覧</Heading>
                <APIEndpoint endpoint={ticketDisplayEndpoint} query={{shopId: shopId}}
                             onEnd={(res, reload) => {
                                 return (
                                     <VStack w={"100%"}>
                                         <TicketDisplay data={res.data.displays} displaySelection={{
                                             processing: true,
                                             called: true,
                                             resolved: true,
                                             informed: true
                                         }}/>
                                         <Btn onClick={reload}>再読み込み</Btn>
                                     </VStack>
                                 )
                             }}
                             queryNotSatisfied={() => {
                                 return (
                                     <Center>
                                         <Text>ShopIdが指定されていません</Text>
                                     </Center>
                                 )
                             }}
                />
            </VStack>
            <CallRight
                initial={initialCount}
                onCountChange={(toChange) => {
                    callCount.current = toChange
                    autoCall()
                }}/>
        </Flex>
    )
}

function CallRight(params: {
    initial: number,
    onCountChange: (callCount: number) => void
}) {

    const [callCount, setCallCount] = useState(params.initial)
    const lastCount = useRef(params.initial)

    function updateCount() {
        params.onCountChange(callCount)
        lastCount.current = callCount
    }

    return (
        <Flex flexGrow={0} direction={"column"} px={3}>
            <Spacer/>
            <Center w={"100%"} mx={2}>
                <VStack>
                    <Text>常に呼ぶ人数</Text>
                    <HStack>
                        <Btn onClick={() => {
                            setCallCount(callCount - 1)
                        }} disabled={callCount <= 0}>-</Btn>
                        <Text px={2}>{callCount}</Text>
                        <Btn onClick={() => {
                            setCallCount(callCount + 1)
                        }}>+</Btn>
                    </HStack>
                    <Btn onClick={updateCount} disabled={callCount === lastCount.current}>変更を確定</Btn>
                </VStack>
            </Center>
            <Spacer/>
            <VStack>
                <Text>バーコード読み取り</Text>
                <Spacer/>
                <BarcodeReader onRead={(barcode: string) => {

                }} autoSelect={true}/>
            </VStack>
            <Spacer/>
        </Flex>
    )
}