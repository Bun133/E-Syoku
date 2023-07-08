"use client"
import {QRCodeReader} from "@/components/reader/QRCodeReader";
import PageTitle from "@/components/pageTitle";
import {Container} from "@chakra-ui/react";
import {Html5QrcodeResult} from "html5-qrcode/es2015/core";
import {VStack} from "@chakra-ui/layout";
import {useRouter} from "next/navigation";

export default function Page() {
    const router = useRouter()
    return (
        <>
            <PageTitle title={"QR Code Reader"}/>
            <VStack>
                <Container maxHeight={500}>
                    <QRCodeReader fps={10} onScan={(decodedText, result) => {
                        const parsed = onScan(decodedText, result)
                        if (parsed) {
                            router.push("/shopui/payment/lookup?uid=" + parsed.userId + "&paymentId=" + parsed.paymentId)
                        }
                    }} qrBox={{width: 300, height: 300}}></QRCodeReader>
                </Container>
            </VStack>
        </>
    )
}

function onScan(decodedText: string, result: Html5QrcodeResult): { userId: string; paymentId: string } | undefined {
    console.log(decodedText, result)
    const split = decodedText.split(":")
    if (split.length == 2) {
        const userId = split[0]
        const paymentId = split[1]
        return {
            userId, paymentId
        }
    }
    return undefined
}