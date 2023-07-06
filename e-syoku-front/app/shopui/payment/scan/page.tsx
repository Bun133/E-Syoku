"use client"
import {QRCodeReader} from "@/components/reader/QRCodeReader";
import PageTitle from "@/components/pageTitle";

export default function Page() {
    return (
        <>
            <PageTitle title={"QR Code Reader"}/>
            <QRCodeReader fps={20} onScan={console.log} qrBox={{width: 300, height: 300}}></QRCodeReader>
        </>
    )
}