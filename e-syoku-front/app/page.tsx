"use client"
import {Center} from "@chakra-ui/layout";
import {CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";
import {Box, Flex, Spacer, Text} from "@chakra-ui/react";
import Link from "next/link";

export default function Home() {
    return (
        <Center h={"calc(100vh - 1rem - 24px - 8px)"} w={"full"} p={2}>
            <Flex h={"full"} w={"67%"} direction={"column"} alignItems={"center"}>
                <LinkBtn href="/buy" text="新規購入"/>
                <Spacer/>
                <LinkBtn href="/payment" text="支払い一覧"/>
                <Spacer/>
                <LinkBtn href="/tickets" text="食券一覧"/>
                <CashierOnly>
                    <Spacer/>
                    <LinkBtn href="/shopui/payment/scan" text="決済取扱"/>
                </CashierOnly>
                <ShopOnly>
                    <Spacer/>
                    <LinkBtn href="/shopui/tickets/call" text="食券呼び出し"/>
                </ShopOnly>
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