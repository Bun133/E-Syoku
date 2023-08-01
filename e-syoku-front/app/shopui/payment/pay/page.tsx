"use client"
import {useRouter, useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {Container, FormControl, FormErrorMessage, FormLabel, NumberInput, NumberInputField} from "@chakra-ui/react";
import React, {useState} from "react";
import Btn from "@/components/btn";
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {markPaymentPaidEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export default function Page() {
    const params = useSearchParams()
    const uid = params.get("uid")
    const paymentId = params.get("paymentId")

    const [amount, setAmount] = useState(0)
    const isAmountError = amount <= 0

    const [error, setError] = useState<EndPointErrorResponse<any>>()

    const auth = useFirebaseAuth()

    const router = useRouter()

    if (!uid || !paymentId) {
        return (
            <>
                <PageTitle title={""}/>
                <Center>
                    <Heading>uid,paymentIdを指定してください</Heading>
                </Center>
            </>
        )
    }

    return (
        <>
            <PageTitle title={`決済取扱い:${uid}:${paymentId}`}/>
            <Container>
                <VStack>
                    <FormControl isRequired={true} isInvalid={isAmountError}>
                        <FormLabel>決済金額</FormLabel>
                        <NumberInput min={0} value={amount} onChange={(s, n) => setAmount(n)}>
                            <NumberInputField/>
                        </NumberInput>
                        {isAmountError ? (<FormErrorMessage>
                            金額を入力してください
                        </FormErrorMessage>) : null}
                    </FormControl>
                    <Btn onClick={() => {
                        const f = async () => {
                            const res = await callEndpoint(markPaymentPaidEndpoint, auth.user, {
                                paidAmount: amount,
                                // TODO paidMeansとremarkを簡単に入力できるように
                                paidMeans: "テスト",
                                userId: uid,
                                paymentId: paymentId,
                                remark: "テストです！"
                            })

                            if (res.isSuccess) {
                                const param = new URLSearchParams()
                                param.set("uid", uid)
                                res.data.ticketsId.forEach((ticketId) => {
                                    param.append("ticketId", ticketId)
                                })


                                router.push(`/shopui/payment/barcode?${param.toString()}`)
                            } else {
                                setError(res)
                            }
                        }
                        f()
                    }} disabled={isAmountError}>決済処理</Btn>
                    <APIErrorModal error={error}/>
                </VStack>
            </Container>
        </>
    )
}