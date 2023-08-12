"use client"
import PageTitle from "@/components/pageTitle";
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