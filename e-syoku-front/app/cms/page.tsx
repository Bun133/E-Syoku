"use client"

import {Center, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export default function Page() {
    return (
        <Center>
            <VStack>
                <Btn href="/cms/payment">決済照会</Btn>
                <Btn href="/cms/ticket">食券照会</Btn>
                <Btn href="/cms/remain">商品在庫</Btn>
            </VStack>
        </Center>
    )
}