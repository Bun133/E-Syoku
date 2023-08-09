"use client"
import {AuthState} from "@/lib/e-syoku-api/AuthTypeProvider";
import {Center, Heading} from "@chakra-ui/layout";
import {Spinner, VStack} from "@chakra-ui/react";
import {useRouter} from "next/navigation";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {listShopsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import Btn from "@/components/btn";

export default function Page() {
    const router = useRouter()
    const auth = useFirebaseAuth()
    return (
        <AuthState comp={(type) => {
            if (!type) {
                return (
                    <Center>
                        <Spinner/>
                    </Center>
                )
            } else {
                if (type.authType === "SHOP") {
                    router.push(`/shopui/tickets/call/id?shopId=${auth.user!!.uid}`)
                    return <></>
                } else if (type.authType === "ADMIN") {
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
                } else {
                    router.push(`/`)
                    return <></>
                }
            }
        }}/>
    )
}