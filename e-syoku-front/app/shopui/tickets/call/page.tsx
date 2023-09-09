"use client"
import {AuthState} from "@/lib/e-syoku-api/AuthTypeProvider";
import {Center, Heading} from "@chakra-ui/layout";
import {Spinner, VStack} from "@chakra-ui/react";
import {useRouter} from "next/navigation";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {listShopsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";

export default function Page() {
    const router = useRouter()
    return (
        <AuthState comp={(type) => {
            if (!type) {
                return (
                    <Center>
                        <Spinner/>
                    </Center>
                )
            } else {
                if (!(type.authType === "SHOP" || type.authType === "ADMIN")) {
                    router.push(`/`)
                    return <></>
                }
                if (type.authType === "SHOP" && type.shopId) {
                    router.push(`/shopui/tickets/call/id?shopId=${type.shopId}`)
                    return <></>
                } else {
                    return (
                        <VStack>
                            <Heading>店舗選択</Heading>
                            <APIEndpoint endpoint={listShopsEndPoint} query={{}} onEnd={(data) => {
                                return (
                                    <VStack>
                                        {data.data.shops.map(s => {
                                            return (
                                                <Btn href={`/shopui/tickets/call/id?shopId=${s.shopId}`} key={s.shopId}>
                                                    {s.name}
                                                </Btn>
                                            )
                                        })}
                                    </VStack>
                                )
                            }}/>
                        </VStack>
                    )
                }
            }
        }}/>
    )
}