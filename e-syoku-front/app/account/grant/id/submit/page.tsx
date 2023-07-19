"use client"
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, Heading} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {grantPermissionEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {Text} from "@chakra-ui/react";

export default function Page() {
    const param = useSearchParams()
    const uid = param.get('uid')
    const authType = param.get('authType')
    const shopId = param.get('shopId') ?? undefined
    if (!uid || !authType) {
        return (
            <>
                <PageTitle title={"権限付与画面"}/>
                <Center>
                    <Heading>uid,authTypeを指定してください</Heading>
                </Center>
            </>
        )
    } else {
        return (
            <>
                <PageTitle title={"権限付与画面"}/>
                {/**@ts-ignore**/}
                <APIEndpoint endpoint={grantPermissionEndpoint} query={{uid: uid, authType: authType, shopId: shopId}}
                             onEnd={(response, reload) => {
                                 return (
                                     <Center>
                                         <Text>{JSON.stringify(response)}</Text>
                                     </Center>
                                 )
                             }}/>
            </>
        )
    }
}