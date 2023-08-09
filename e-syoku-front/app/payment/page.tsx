"use client"
import {listPaymentsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {VStack} from "@chakra-ui/layout";
import {PaymentSelection} from "@/components/form/PaymentSelection";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {Spacer} from "@chakra-ui/react";
import Btn from "@/components/btn";

export default function Page() {
    return (
        <>
            <PageTitle title={"支払い一覧"}></PageTitle>
            <APIEndpoint endpoint={listPaymentsEndPoint} query={{}} onEnd={(response, reload) => {
                return (
                    <VStack>
                        <PaymentSelection payments={response.data.payments} onSelect={console.log}></PaymentSelection>
                        <Spacer/>
                        <Btn onClick={reload}>再読み込み</Btn>
                    </VStack>
                )
            }}/>
        </>
    )
}