"use client"
import Btn from "@/components/btn";
import {Center, VStack} from "@chakra-ui/layout";
import {Box, Container} from "@chakra-ui/react";

export default function Home() {
    return (
        <Container>
            <Center>
                <VStack>
                    <Btn href="/order">
                        新規注文
                    </Btn>
                    <Btn href="/payment/">
                        決済一覧
                    </Btn>
                    <Btn href="/tickets">
                        食券一覧
                    </Btn>
                </VStack>
            </Center>
        </Container>
    )
}
