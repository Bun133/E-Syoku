"use client"
import {useRouter, useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {
    Box,
    Container,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    NumberInput,
    NumberInputField,
    useRadio,
    useRadioGroup
} from "@chakra-ui/react";
import React, {useState} from "react";
import Btn from "@/components/btn";
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {markPaymentPaidEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export default function Page() {
    const params = useSearchParams()
    const paymentId = params.get("paymentId") ?? undefined
    const barcode = params.get("barcode") ?? undefined

    const [amount, setAmount] = useState(0)
    const isAmountError = amount <= 0

    const [paidMeans, setPaidMeans] = useState<string>("")
    const isPaidMeansError = paidMeans.length <= 0

    const [error, setError] = useState<EndPointErrorResponse<any>>()

    const auth = useFirebaseAuth()

    const router = useRouter()

    if(!(paymentId || barcode)){
        return (
            <>
                <PageTitle title={""}/>
                <Center>
                    <Heading>uid,paymentId,barcodeを指定してください</Heading>
                </Center>
            </>
        )
    }

    return (
        <>
            <PageTitle title={`決済取扱い:${paymentId}`}/>
            <Container>
                <VStack>
                    <FormControl>
                        <FormLabel>決済方法</FormLabel>
                        <Center>
                            <PaidMeans onChange={(mean) => {
                                setPaidMeans(mean)
                            }}/>
                        </Center>
                        {isPaidMeansError ? (<FormErrorMessage>
                            決済方法を選択してください
                        </FormErrorMessage>) : null}
                    </FormControl>
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
                                paidMeans: paidMeans,
                                paymentId: paymentId,
                                paymentBarcode: barcode,
                                // TODO remarkを簡単に入力できるように
                                remark: "テストです！"
                            })

                            if (res.isSuccess) {
                                const param = new URLSearchParams()
                                res.data.ticketsId.forEach((ticketId) => {
                                    param.append("ticketId", ticketId)
                                })

                                router.push(`/shopui/payment/barcode?${param.toString()}`)
                            } else {
                                setError(res)
                            }
                        }
                        f()
                    }} disabled={isAmountError || isPaidMeansError}>決済処理</Btn>
                    <APIErrorModal error={error}/>
                </VStack>
            </Container>
        </>
    )
}

function PaidMeans(params: {
    onChange: (mean: string) => void
}) {
    const values = ["現金", "IC"]

    const {getRootProps, getRadioProps} = useRadioGroup({
        name: 'framework',
        defaultValue: 'react',
        onChange: params.onChange
    })

    const group = getRootProps()

    return (
        <Flex {...group} w={"max"}>
            {values.map(v => {
                const radio = getRadioProps({value: v})
                return (
                    <PaidMean
                        key={v}
                        {...radio}
                    >
                        <Center>
                            <Heading>
                                {v}
                            </Heading>
                        </Center>
                    </PaidMean>
                )
            })}
        </Flex>
    )
}

function PaidMean(params: any) {
    const {getInputProps, getRadioProps} = useRadio(params)

    return (
        <Box as="label" flexGrow={1}>
            <input {...getInputProps()}/>
            <Box
                {...getRadioProps()}
                cursor="pointer"
                borderColor={"blue.300"}
                borderWidth={1}
                borderRadius={4}
                _checked={{
                    backgroundColor: "blue.100"
                }}
                p={2} mx={5}
                minWidth={"10rem"}
            >
                {params.children}
            </Box>
        </Box>
    )
}