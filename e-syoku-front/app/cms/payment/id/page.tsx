"use client"
import {useSearchParams} from "next/navigation";
import {Center, HStack, VStack} from "@chakra-ui/layout";
import {Box, Spacer, Text, UnorderedList} from "@chakra-ui/react";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {cmsPaymentListEndpoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay
} from "@chakra-ui/modal";
import React, {useRef} from "react";
import {PaidDetail, PrettyOrder, PrettyPaymentSession} from "@/lib/e-syoku-api/Types";
import {useDisclosure} from "@chakra-ui/hooks";
import {orderDataTransform} from "@/lib/e-syoku-api/Transformers";
import Barcode from "react-barcode";

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid")

    const currentPayment = useRef<PrettyPaymentSession>()
    const {isOpen, onOpen, onClose} = useDisclosure()

    if (!uid) {
        return (
            <Center>
                <Text>
                    uidが指定されていないため、ペメモの表示に失敗しています。
                </Text>
            </Center>
        )
    }

    return (<>
            <APIEndpoint endpoint={cmsPaymentListEndpoint} query={{uid: uid}} onEnd={(response, reload) => {
                return (
                    <VStack w={"full"}>
                        {response.data.payments.map(payment => {
                            return (
                                <HStack w={"full"} key={payment.sessionId} borderColor={"black.300"} borderWidth={2}
                                        p={2}>
                                    <Text>{payment.sessionId}</Text>
                                    <Spacer/>
                                    <Text>{payment.state}</Text>
                                    <Spacer/>
                                    <Text>{payment.totalAmount}</Text>
                                    <Spacer/>
                                    <Btn onClick={() => {
                                        currentPayment.current = payment
                                        onOpen()
                                    }}>詳しく見る</Btn>
                                </HStack>
                            )
                        })}

                        <Btn onClick={reload}>再表示</Btn>
                    </VStack>
                )
            }}/>
            <Modal size={"full"} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalCloseButton/>
                    <ModalHeader>
                        決済情報詳細
                    </ModalHeader>

                    <ModalBody>
                        <Text>決済セッションID:{currentPayment.current?.sessionId}</Text>
                        <Box h={"1rem"}/>
                        <Text>ステータス:{currentPayment.current?.state}</Text>
                        {currentPayment.current?.paidDetail && (<>
                            <Box h={"1rem"}/>
                            <PaymentDetail data={currentPayment.current.paidDetail}/>
                        </>)}
                        <Box h={"1rem"}/>
                        <Text>注文内容:</Text>
                        <OrderContent data={currentPayment.current?.orderContent}/>
                        {currentPayment.current?.barcode && (
                            <>
                                <Box h={"1rem"}/>
                                <Text>バーコード:</Text>
                                <Barcode value={currentPayment.current.barcode}/>
                            </>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Btn onClick={onClose}>閉じる</Btn>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

function PaymentDetail(params: { data: PaidDetail }) {
    return (
        <VStack>
            <Text>決済時刻：{params.data.paidTime._seconds}s, {params.data.paidTime._nanoseconds}ns</Text>
            <Text>決済扱い者：{params.data.paymentStaffId}</Text>
            <Text>決済方法：{params.data.paidMeans}</Text>
            <Text>決済金額：{params.data.paidAmount}</Text>
            {params.data.remark && <Text>備考：{params.data.remark}</Text>}
        </VStack>
    )
}

function OrderContent(params: { data: PrettyOrder | undefined }) {
    if (params.data) {
        return (
            <UnorderedList>
                {orderDataTransform(params.data)}
            </UnorderedList>
        )
    }
    return null
}