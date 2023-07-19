"use client"
import {useRouter, useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {ListSelectionPrimitive} from "@/components/form/ListSelection";
import {useRef, useState} from "react";
import Btn from "@/components/btn";
import {Input} from "@chakra-ui/react";

export default function Page() {
    const param = useSearchParams()
    const uid = param.get("uid")
    const [authType, setAuthType] = useState<string>()
    const shopId = useRef<string>()
    const router = useRouter()

    if (!uid) {
        return (
            <>
                <PageTitle title={"権限付与画面"}/>
                <Center>
                    <Heading>uidが指定されていません</Heading>
                </Center>
            </>
        )
    } else {
        return (
            <>
                <PageTitle title={"権限付与画面"}/>
                <Center>
                    <VStack>
                        <ListSelectionPrimitive values={["ADMIN", "SHOP", "ANONYMOUS"]} selected={setAuthType}/>
                        <Input value={shopId.current} onChange={(t) => {
                            shopId.current = t.target.value
                        }} placeholder={"ShopID(Optional)"}></Input>
                        <Btn onClick={() => {
                            router.push(`/account/grant/id/submit?uid=${uid}&authType=${authType}${shopId.current ? `&shopId=${shopId.current}` : ""}`)
                        }} disabled={!authType}>送信</Btn>
                    </VStack>
                </Center>
            </>
        )
    }
}