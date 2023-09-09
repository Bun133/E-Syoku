"use client"
import {Center} from "@chakra-ui/layout";
import {Authed, CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";
import {Box, Flex, Spacer, Text} from "@chakra-ui/react";
import Link from "next/link";
import {challengeAndLoginPush, useFirebaseAuth} from "@/lib/firebase/authentication";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function Home() {
    const auth = useFirebaseAuth()
    const router = useRouter()
    useEffect(() => {
        if (auth.auth) {
            challengeAndLoginPush(auth.auth, router, "/")
        }
    }, [auth.auth]);

    return (
        <Center h={"calc(100dvh - 1rem - 24px - 8px)"} w={"full"} p={2}>
            <Flex h={"full"} w={"67%"} direction={"column"} alignItems={"center"}>
                <Authed types={["ANONYMOUS", "ADMIN"]} success={(type) => {
                    return (
                        <BuyingEntries/>
                    )
                }}/>
                <CashierOnly>
                    <LinkBtn href="/shopui/payment/scan" text="決済取扱"/>
                </CashierOnly>
                <ShopOnly>
                    <LinkBtn href="/shopui/tickets/call" text="食券呼び出し"/>
                </ShopOnly>
                <Spacer/>
                <LinkBtn href="/help/list" text="ヘルプ一覧"/>
            </Flex>
        </Center>
    )
}

function LinkBtn(params: { href: string, text: string }) {
    return (
        <Box w={"full"} mx={3} backgroundColor={"blue.500"} borderRadius={"xl"} boxShadow={"xl"} flexGrow={1}
             flexShrink={1}>
            <Link href={params.href} style={{width: "100%", height: "100%"}}>
                <Center w={"full"} h={"full"}>
                    <Text fontSize={"3xl"} color={"white"}>{params.text}</Text>
                </Center>
            </Link>
        </Box>
    )
}

function BuyingEntries() {
    return (
        <>
            <LinkBtn href="/buy" text="新規購入"/>
            <Spacer/>
            <LinkBtn href="/payment" text="支払い一覧"/>
            <Spacer/>
            <LinkBtn href="/tickets" text="食券一覧"/>
            <Spacer/>
        </>
    )
}