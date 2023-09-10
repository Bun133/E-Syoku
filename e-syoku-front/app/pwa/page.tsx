"use client"
import {MdComponent} from "@/components/error/ErrorMdComponent";
import {VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";

export default function Page() {
    // force client-side rendering
    const _ = useSearchParams()

    function isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches
    }

    const [homeBtn, setHomeBtn] = useState(false)
    useEffect(() => {
        setHomeBtn(isPWA())
    }, [])

    return (
        <VStack>
            <MdComponent mdFileName={"pwa.md"}/>
            {homeBtn && <Btn href={"/"}>ホームへ</Btn>}
        </VStack>
    )
}