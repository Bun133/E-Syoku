"use client"
import {MdComponent} from "@/components/error/ErrorMdComponent";
import {VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export default function Page() {
    function isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches
    }

    return (
        <VStack>
            <MdComponent mdFileName={"pwa.md"}/>
            {isPWA() && <Btn href={"/"}>ホームへ</Btn>}
        </VStack>
    )
}