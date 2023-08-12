"use client"

import {useSearchParams} from "next/navigation";
import {Box, Spacer, Text} from "@chakra-ui/react";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {callTicketStackEndpoint, resolveTicketEndPoint, ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {TicketDisplay} from "@/components/TicketDisplay";
import Btn from "@/components/btn";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import {useRef, useState} from "react";
import {EndPointErrorResponse, useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

const initialCount = 10

export default function Page() {
    const params = useSearchParams()
    const shopId = params.get("shopId") ?? undefined
    const callCount = useRef(initialCount)
    const {fetch: callTicketStack} = useLazyEndpoint(callTicketStackEndpoint)
    const {fetch: resolveTicket} = useLazyEndpoint(resolveTicketEndPoint)
    const reloadFunc = useRef<() => void | null>()
    const apiError = useRef<EndPointErrorResponse<any>>()

    async function autoCall() {
        if (shopId == undefined) {
            return
        }
        const r = await callTicketStack({
            shopId: shopId,
            count: callCount.current
        })
    }


    return (
        <HStack w={"full"} h={"100%"}>
            <VStack flexShrink={1}>
                <Heading>食券一覧</Heading>
                <Box h={"full"} w={"calc(100vw - 20rem)"}>
                    <APIEndpoint endpoint={ticketDisplayEndpoint} query={{shopId: shopId}}
                                 onEnd={(res, reload) => {
                                     reloadFunc.current = reload

                                     return (
                                         <VStack w={"full"} h={"full"}>
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
                </Box>
            </VStack>
            <CallRight
                initial={initialCount}
                onCountChange={(toChange) => {
                    callCount.current = toChange
                    autoCall()
                }}
                onBarcodeRead={async (barcode: string) => {
                    const r = await resolveTicket({barcode: barcode})
                    // TODO ましに出来るはず
                    if (r) {
                        if (r.isSuccess) {
                            if (reloadFunc.current) {
                                reloadFunc.current()
                            }
                        } else {
                            apiError.current = r
                        }
                    }
                }}
            />
            <APIErrorModal error={apiError.current}/>
        </HStack>
    )
}

function CallRight(params: {
    initial: number,
    onCountChange: (callCount: number) => void,
    onBarcodeRead: (barcode: string) => Promise<void>
}) {

    const [callCount, setCallCount] = useState(params.initial)
    const lastCount = useRef(params.initial)

    function updateCount() {
        params.onCountChange(callCount)
        lastCount.current = callCount
    }

    return (
        <VStack px={3} w={"20rem"}>
            <Spacer/>
            <Center w={"full"} mx={2}>
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
                <BarcodeReader onRead={params.onBarcodeRead} autoSelect={true}/>
            </VStack>
            <Spacer/>
        </VStack>
    )
}