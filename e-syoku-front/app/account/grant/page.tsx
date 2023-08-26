"use client"
import PageTitle from "@/components/pageTitle";
import {useRouter} from "next/navigation";
import {Container} from "@chakra-ui/react";
import {QRCodeReader} from "@/components/reader/QRCodeReader";

export default function Page() {
    const router = useRouter()

    return (
        <>
            <PageTitle title={"権限付与画面"}/>
            <Container maxH={"500px"}>
                <QRCodeReader fps={30} onScan={(decodedText, result) => {
                    router.push(`/account/grant/id?uid=${decodedText}`)
                }} qrBox={{width: 300, height: 300}}/>
            </Container>
        </>
    )
}