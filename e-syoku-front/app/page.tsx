"use client"
import Btn from "@/components/btn";
import {Center, HStack} from "@chakra-ui/layout";

export default function Home() {
    return (
        <Center>
            <HStack>
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
            </HStack>
        </Center>
    )
}
