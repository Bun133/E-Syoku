"use client"
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listPaymentsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {Loader} from "react-feather";
import {PaymentSelection} from "@/components/form/PaymentSelection";

export default function Page() {
    const {response: data} = useEndpoint(listPaymentsEndPoint, {})
    if (data) {
        if (data.data) {
            return (
                <>
                    <PageTitle title={"決済一覧"}></PageTitle>
                    <VStack>
                        <PaymentSelection payments={data.data.payments} onSelect={console.log}></PaymentSelection>
                    </VStack>
                </>
            )
        }
        return (
            <>
                <PageTitle title={"決済一覧"}></PageTitle>
                <Heading>
                    データの取得に失敗しました
                </Heading>
            </>
        )
    } else {
        return (
            <>
                <PageTitle title={"決済一覧"}></PageTitle>
                <Center><Loader></Loader></Center>
            </>
        )
    }
}