"use client"
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {listShopsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Container} from "@chakra-ui/react";
import {Center, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {useRouter} from "next/navigation";
import PageTitle from "@/components/pageTitle";

export default function Page() {
    const router = useRouter()
    return (
        <>
            <PageTitle title={"店舗選択"}/>
            <APIEndpoint endpoint={listShopsEndPoint} query={{}} onEnd={(data) => {
                return (
                    <Container>
                        <VStack>
                            <Center>店舗を選んでください</Center>
                            {data.data.shops.map((shop) => {
                                return (
                                    <Btn onClick={() => {
                                        router.push(`/shopui/tickets/display/id?shopId=${shop.shopId}`)
                                    }} key={shop.shopId}>{shop.name}</Btn>
                                )
                            })}
                        </VStack>
                    </Container>
                )
            }}/>
        </>
    )
}