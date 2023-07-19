"use client"
import PageTitle from "@/components/pageTitle";
import {QRCodeReader} from "@/components/reader/QRCodeReader";
import {useRouter} from "next/navigation";
import {Container} from "@chakra-ui/react";

export default function Page() {
    const router = useRouter()

    return (
        <>
            <PageTitle title={"権限付与画面"}/>
            <Container maxH={"500px"}>
                <QRCodeReader fps={10} onScan={(decodedText, result) => {
                    router.push(`/account/grant/id?uid=${decodedText}`)
                }} qrBox={{width: 300, height: 300}}/>
            </Container>
        </>
    )
}