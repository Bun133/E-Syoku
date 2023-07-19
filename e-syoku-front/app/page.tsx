"use client"
import Btn from "@/components/btn";
import {Center, VStack} from "@chakra-ui/layout";
import {Box} from "@chakra-ui/react";

export default function Home() {
    return (
        <Box minH={"max-content"}>
            <Center>
                <VStack>
                    <Btn href="/tickets">
                        食券一覧
                    </Btn>
                    <Btn href="/shopui/tickets/display">
                        食券一覧画面(店舗側)
                    </Btn>
                    <Btn href="/shopui/tickets/call">
                        食券呼び出し(店舗側)
                    </Btn>
                    <Btn href="/order/">
                        メニュー
                    </Btn>
                    <Btn href="/payment/">
                        決済一覧
                    </Btn>
                    <Btn href="/shopui/payment/scan">
                        決済処理取り扱い(店舗側)
                    </Btn>
                </VStack>
            </Center>
        </Box>
    )
}
