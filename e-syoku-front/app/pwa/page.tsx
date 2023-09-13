"use client"
import {MdComponent} from "@/components/error/ErrorMdComponent";
import {HStack, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {Text} from "@chakra-ui/react";

export default function Page() {
    // force client-side rendering
    const _ = useSearchParams()

    function isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches
    }

    const [pwa, setPwa] = useState(false)
    useEffect(() => {
        setPwa(isPWA())
    }, [])

    return (
        <VStack>
            <MdComponent mdFileName={"pwa.md"}/>
            <HStack>
                <Text>現在の環境：</Text>
                {pwa ? <Text color={"green"}>アプリ環境です</Text> :
                    <Text color={"red"}>アプリ環境ではありません</Text>}
            </HStack>
            <Btn href={"/"}>ホームへ</Btn>
        </VStack>
    )
}