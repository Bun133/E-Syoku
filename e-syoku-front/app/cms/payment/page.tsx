"use client"
import {QRCodeReader} from "@/components/reader/QRCodeReader";
import {Container} from "@chakra-ui/react";
import {useRouter} from "next/navigation";
import {AspectRatio} from "@chakra-ui/layout";

export default function Page() {
    const router = useRouter()

    return (
        <Container>
            <AspectRatio ratio={1}>
                <QRCodeReader fps={30} onScan={(decodedText, result) => {
                    router.push(`/cms/payment/id?uid=${decodedText}`)
                }}/>
            </AspectRatio>
        </Container>
    )
}