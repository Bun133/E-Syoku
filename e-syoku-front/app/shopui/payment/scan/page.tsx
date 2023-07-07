"use client"
import {QRCodeReader} from "@/components/reader/QRCodeReader";
import PageTitle from "@/components/pageTitle";
import {Container, List, ListItem} from "@chakra-ui/react";
import {Html5QrcodeResult} from "html5-qrcode/es2015/core";
import {useState} from "react";
import {PaymentIdRequest} from "@/lib/e-syoku-api/Types";
import {VStack} from "@chakra-ui/layout";

export default function Page() {
    const [reqs, setReqs] = useState<PaymentIdRequest[]>([])

    return (
        <>
            <PageTitle title={"QR Code Reader"}/>
            <VStack>
                <Container maxHeight={500}>
                    <QRCodeReader fps={10} onScan={(decodedText, result) => {
                        const parsed = onScan(decodedText, result)
                        if (parsed) {
                            setReqs(reqs.concat([parsed]))
                        }
                    }} qrBox={{width: 300, height: 300}}></QRCodeReader>
                </Container>
                <Container>
                    <List>
                        {reqs.map((req, index) => {
                            return (
                                <ListItem key={index}>
                                    {req.userId}:{req.paymentId}
                                </ListItem>
                            )
                        })}
                    </List>
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