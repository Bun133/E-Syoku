"use client"

import {Center, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export default function Page() {
    return (
        <Center>
            <VStack>
                <Btn href="/cms/ticket">食券照会</Btn>
            </VStack>
        </Center>
    )
}