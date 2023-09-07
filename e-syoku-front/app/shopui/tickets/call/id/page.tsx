"use client"

import {useSearchParams} from "next/navigation";
import {Box, ModalContent, Spacer, Switch, Text} from "@chakra-ui/react";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {callTicketStackEndpoint, resolveTicketEndPoint, ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {TicketDisplay} from "@/components/TicketDisplay";
import Btn from "@/components/btn";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import {useEffect, useRef, useState} from "react";
import {EndPointErrorResponse, EndPointResponse, useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {APIErrorModal} from "@/components/modal/APIErrorModal";
import {PrettyTicket, TicketResponse} from "@/lib/e-syoku-api/Types";
import {useDisclosure} from "@chakra-ui/hooks";
import {Modal, ModalBody, ModalCloseButton, ModalHeader, ModalOverlay} from "@chakra-ui/modal";
import {TicketComponent} from "@/components/Ticket";
import {useToast} from "@chakra-ui/toast";
import {AlertCircle} from "react-feather";

const initialCount = 10

export default function Page() {
    const params = useSearchParams()
    const shopId = params.get("shopId") ?? undefined

    const reloadFunc = useRef<() => Promise<void> | null>()
    const [apiError, setAPIError] = useState<EndPointErrorResponse<any>>()
    const readTicket = useRef<PrettyTicket>()

    if (!shopId) {
        return (
            <Center>
                <Text>ShopIdを指定してください</Text>
            </Center>
        )
    }

    return (
        <HStack w={"full"} h={"100%"}>
            <VStack flexShrink={1}>
                <Heading>食券一覧</Heading>
                <Box h={"full"} w={"calc(100vw - 20rem)"}>
                    <APIEndpoint endpoint={ticketDisplayEndpoint} query={{shopId: shopId}}
                                 disableLoading={true}
                                 onEnd={(res, reload) => {
                                     reloadFunc.current = reload

                                     return (
                                         <VStack w={"full"} h={"full"}>
                                             <TicketDisplay data={res.data.tickets} disableAutoScroll={true}/>
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
                shopId={shopId}
                onAutoCall={() => {
                    reloadFunc.current?.()
                }}
                onBarcodeRead={async (r: EndPointResponse<TicketResponse>) => {
                    if (r.isSuccess) {
                        reloadFunc.current?.()
                        readTicket.current = r.data.ticket
                    } else {
                        setAPIError(r)
                    }
                }}
            />
            <ReadModal readTicket={readTicket.current}/>
            <APIErrorModal error={apiError}/>
        </HStack>
    )
}

type AutoCallSettings = {
    toAutoCall: false,
} | {
    toAutoCall: true,
    toCallCount: number,
    // 指定時間経過後も受け取りに来ないお客さんは、呼び出し人数カウントから除外する
    ignoreTimeThresholdMin: number
}

const defaultCallCount = 10
const maxCallCount = 20

const defaultIgnoreTimeThresholdMin = 30

function CallRight(params: {
    shopId: string,
    onAutoCall: () => void,
    onBarcodeRead: (r: EndPointResponse<TicketResponse>) => void
}) {

    const [callSettings, setCallSettings] = useState<AutoCallSettings>({toAutoCall: false})
    const [editingCallSettings, setEditingCallSettings] = useState<AutoCallSettings>(callSettings)

    const {fetch: callTicketStack} = useLazyEndpoint(callTicketStackEndpoint)
    const {fetch: resolveTicket} = useLazyEndpoint(resolveTicketEndPoint)

    const {isOpen, onClose, onOpen} = useDisclosure()

    const toast = useToast()

    async function callStack() {
        console.log("callStack", callSettings)
        if (callSettings.toAutoCall) {
            const r = await callTicketStack({
                shopId: params.shopId,
                count: callSettings.toCallCount,
                thresholdMin: callSettings.ignoreTimeThresholdMin
            })

            if (r.isSuccess) {
                // 画面上に呼び出し枚数の通知を出す
                if (r.data.calledTicketIds.length > 0) {
                    toast({
                        icon: <AlertCircle/>,
                        title: "呼び出し済み",
                        description: `${r.data.calledTicketIds.length}枚の食券を呼び出しました`,
                        status: "info"
                    })
                }
            }

            params.onAutoCall()
        }
    }

    function editIncrementCallCount() {
        if (editingCallSettings.toAutoCall) {
            setEditingCallSettings({
                toAutoCall: true,
                toCallCount: editingCallSettings.toCallCount + 1,
                ignoreTimeThresholdMin: editingCallSettings.ignoreTimeThresholdMin
            })
        }
    }

    function editDecrementCallCount() {
        if (editingCallSettings.toAutoCall) {
            if (editingCallSettings.toCallCount > 0) {
                setEditingCallSettings({
                    toAutoCall: true,
                    toCallCount: editingCallSettings.toCallCount - 1,
                    ignoreTimeThresholdMin: editingCallSettings.ignoreTimeThresholdMin
                })
            }
        }
    }

    function editIncrementIsDisabled() {
        return !editingCallSettings.toAutoCall || editingCallSettings.toCallCount >= maxCallCount
    }

    function editDecrementIsDisabled() {
        return !editingCallSettings.toAutoCall || (editingCallSettings.toAutoCall && editingCallSettings.toCallCount <= 0)
    }

    function callCountToString(callSetting: AutoCallSettings) {
        if (callSetting.toAutoCall) {
            return callSetting.toCallCount.toString() + "人"
        } else {
            return "未設定"
        }
    }

    function editIncrementThreshold() {
        if (editingCallSettings.toAutoCall) {
            setEditingCallSettings({
                toAutoCall: true,
                toCallCount: editingCallSettings.toCallCount,
                ignoreTimeThresholdMin: editingCallSettings.ignoreTimeThresholdMin + 1
            })
        }
    }

    function editDecrementThreshold() {
        if (editingCallSettings.toAutoCall) {
            if (editingCallSettings.ignoreTimeThresholdMin > 0) {
                setEditingCallSettings({
                    toAutoCall: true,
                    toCallCount: editingCallSettings.toCallCount,
                    ignoreTimeThresholdMin: editingCallSettings.ignoreTimeThresholdMin - 1
                })
            }
        }
    }

    function editIncrementThresholdIsDisabled() {
        return !editingCallSettings.toAutoCall
    }

    function editDecrementThresholdIsDisabled() {
        return !editingCallSettings.toAutoCall
    }

    function thresholdToString(callSetting: AutoCallSettings) {
        if (callSetting.toAutoCall) {
            return callSetting.ignoreTimeThresholdMin.toString() + "分"
        } else {
            return "未設定"
        }
    }

    function openSettingModal() {
        // Copy setting to editing setting
        setEditingCallSettings(callSettings)
        onOpen()
    }

    function editAutoCall(toAutoCall: boolean) {
        if (toAutoCall) {
            setEditingCallSettings({
                toAutoCall: true,
                toCallCount: defaultCallCount,
                ignoreTimeThresholdMin: defaultIgnoreTimeThresholdMin
            })
        } else {
            setEditingCallSettings({toAutoCall: false})
        }
    }

    async function applyEditing() {
        // Copy setting to editing setting
        setCallSettings(editingCallSettings)
        // Close modal
        onClose()
    }

    useEffect(() => {
        // on Update
        // 変更後呼び出し処理
        callStack()
    }, [callSettings]);

    function isApplyDisabled() {
        // Compare callSetting and editingCallSetting
        return JSON.stringify(callSettings) === JSON.stringify(editingCallSettings)
    }

    async function onBarcodeRead(barcode: string) {
        const r = await resolveTicket({barcode: barcode})
        params.onBarcodeRead(r)
        // バーコード読み取り後呼び出し処理
        await callStack()
    }

    return (
        <VStack px={3} w={"20rem"}>
            <Spacer/>
            <Center w={"full"} mx={2}>
                <VStack>
                    <CallEnabledText toAutoCall={callSettings.toAutoCall}/>
                    <HStack>
                        <Text>常に呼ぶ人数：</Text>
                        <Text>{callCountToString(callSettings)}</Text>
                    </HStack>
                    <HStack>
                        <Text>放置基準時間：</Text>
                        <Text>{thresholdToString(callSettings)}</Text>
                    </HStack>
                    <Btn onClick={openSettingModal}>設定変更</Btn>


                    <Modal isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay/>
                        <ModalContent>
                            <ModalCloseButton/>
                            <ModalHeader>
                                <Text>自動呼出し設定画面</Text>
                            </ModalHeader>
                            <ModalBody>
                                <VStack>
                                    <HStack>
                                        <CallEnabledText toAutoCall={editingCallSettings.toAutoCall}/>
                                        <Switch
                                            defaultChecked={callSettings.toAutoCall}
                                            onChange={(e) => {
                                                editAutoCall(e.target.checked)
                                            }}/>
                                    </HStack>
                                    <HStack>
                                        <Text>常に呼び出す人数</Text>
                                        <Spacer minWidth={"2rem"}/>
                                        <HStack>
                                            <Btn onClick={editDecrementCallCount}
                                                 disabled={editDecrementIsDisabled()}>-</Btn>
                                            <Text px={2}>{callCountToString(editingCallSettings)}</Text>
                                            <Btn onClick={editIncrementCallCount}
                                                 disabled={editIncrementIsDisabled()}>+</Btn>
                                        </HStack>
                                    </HStack>
                                    <HStack>
                                        <Text>放置基準時間</Text>
                                        <Spacer minWidth={"2rem"}/>
                                        <HStack>
                                            <Btn onClick={editDecrementThreshold}
                                                 disabled={editDecrementThresholdIsDisabled()}>-</Btn>
                                            <Text px={2}>{thresholdToString(editingCallSettings)}</Text>
                                            <Btn onClick={editIncrementThreshold}
                                                 disabled={editIncrementThresholdIsDisabled()}>+</Btn>
                                        </HStack>
                                    </HStack>
                                    <Btn onClick={applyEditing} disabled={isApplyDisabled()}>変更を確定</Btn>
                                </VStack>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </VStack>
            </Center>
            <Spacer/>
            <VStack>
                <Text>バーコード読み取り</Text>
                <Spacer/>
                <BarcodeReader onRead={onBarcodeRead} autoSelect={true}/>
            </VStack>
            <Spacer/>
        </VStack>
    )
}

function CallEnabledText(params: { toAutoCall: boolean }) {
    if (params.toAutoCall) {
        return (
            <HStack>
                <Text>自動呼出し：</Text>
                <Text color={"green"}>設定済み</Text>
            </HStack>
        )
    } else {
        return (
            <HStack>
                <Text>自動呼出し：</Text>
                <Text color={"red"}>未設定</Text>
            </HStack>
        )
    }
}

function ReadModal(params: {
    readTicket: PrettyTicket | undefined
}) {
    const {isOpen, onClose, onOpen} = useDisclosure()

    useEffect(() => {
        if (params.readTicket) {
            onOpen()
        }
    }, [params.readTicket])

    if (!params.readTicket) {
        return null
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>
                    <ModalCloseButton/>
                    <Heading>受け渡し内容</Heading>
                </ModalHeader>
                <ModalBody>
                    <TicketComponent
                        ticket={params.readTicket}
                        button={(
                            <Btn onClick={onClose}>閉じる</Btn>
                        )}
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}