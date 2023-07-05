"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useSearchParams} from "next/navigation";
import React from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import Btn from "@/components/btn";
import {Center, Heading} from "@chakra-ui/layout";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id")
    const {response: data, isLoaded, fetch: reload} = useEndpoint(ticketStatusEndPoint, {ticketId: id})
    if (id === null) {
        return (
            <>
                <PageTitle title={"エラー"}></PageTitle>
                <Center>
                    <Heading>IDが指定されていません</Heading>
                </Center>
            </>
        )
    }

    const ticket = data?.data?.ticket

    if (!isLoaded) {
        return (
            <div>
                <PageTitle title={"読み込み中"}></PageTitle>
                <div className={"flex flex-col items-center justify-center"}>
                    <div className={"font-bold text-xl"}>読み込み中</div>
                </div>
            </div>
        )
    }

    if (ticket !== undefined) {
        return (
            <div>
                <PageTitle title={"食券番号 " + ticket.ticketNum}></PageTitle>
                <div>
                    <div className={"flex flex-col items-center justify-center"}>{ticket.ticketNum}</div>
                    <div>Status : {data?.data?.ticket?.status}</div>
                    <div>UniqueId : {data?.data?.ticket?.uniqueId}</div>
                    <div>ShopId : {data?.data?.ticket?.shopId}</div>
                    <div className={"flex flex-col items-center justify-center mt-10"}>
                        <Btn onClick={() => reload()}>再読み込み</Btn>
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div>
                <PageTitle title={"食券が見つかりませんでした"}></PageTitle>
                <div className={"flex flex-col items-center justify-center"}>
                    <div className={"font-bold text-xl"}>食券番号をご確認ください</div>
                </div>
            </div>
        )
    }
}