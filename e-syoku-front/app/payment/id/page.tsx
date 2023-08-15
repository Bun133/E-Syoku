"use client"
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, VStack} from "@chakra-ui/layout";
import {paymentStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";
import React from "react";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {PaymentCard} from "@/components/Payment";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id") ?? undefined

    return (
        <>
            <PageTitle title={"決済セッション:" + id}/>
            <APIEndpoint endpoint={paymentStatusEndPoint} query={{paymentId: id}} onEnd={(response, reload) => {
                const payment = response.data.payment
                return (
                    <Center>
                        <VStack>
                            <PaymentCard payment={response.data.payment}/>
                            <Btn onClick={reload}>再読み込み</Btn>
                        </VStack>
                    </Center>
                )
            }}/>
        </>
    )
}