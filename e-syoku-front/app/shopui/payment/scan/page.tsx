"use client"
import PageTitle from "@/components/pageTitle";
import {Html5QrcodeResult} from "html5-qrcode/es2015/core";
import {VStack} from "@chakra-ui/layout";
import {useRouter} from "next/navigation";
import {BarcodeReader} from "@/components/reader/BarcodeReader";

export default function Page() {
    const router = useRouter()
    return (
        <>
            <PageTitle title={"決済バーコード読み取り"}/>
            <VStack>
                <BarcodeReader onRead={(barcode) => {
                    router.push("/shopui/payment/lookup?barcode=" + barcode)
                }} autoSelect={true}/>
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