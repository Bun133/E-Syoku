"use client"
import Btn from "@/components/btn";
import {Center, VStack} from "@chakra-ui/layout";
import {Box, Container} from "@chakra-ui/react";
import {CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";

export default function Home() {
    return (
        <Container>
            <Center>
                <VStack>
                    <Btn href="/order">
                        新規注文
                    </Btn>
                    <Btn href="/payment/">
                        支払い一覧
                    </Btn>
                    <Btn href="/tickets">
                        食券一覧
                    </Btn>
                    <CashierOnly>
                        <Btn href="/payment/scan">
                            決済取扱
                        </Btn>
                    </CashierOnly>
                    <ShopOnly>
                        <Btn href="/shopui/tickets/call">
                            食券呼び出し
                        </Btn>
                    </ShopOnly>
                </VStack>
            </Center>
        </Container>
    )
}
