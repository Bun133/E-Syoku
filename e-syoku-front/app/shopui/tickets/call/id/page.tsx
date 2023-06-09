"use client"

import PageTitle from "@/components/pageTitle";
import {useSearchParams} from "next/navigation";
import {useEndpoint, useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {callTicketEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Loader} from "react-feather";
import {Center, Heading} from "@chakra-ui/layout";
import React from "react";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id")
    const {response: data,firstCall} = useLazyEndpoint(callTicketEndPoint)
    if (id === null) {
        return (
            <>
                <PageTitle title={"エラー"}></PageTitle>
                <Center>
                    <Heading>idが指定されていません</Heading>
                </Center>
            </>
        )
    }
    if (!data) {
        firstCall({ticketId: id})
        return (
            <div>
                <PageTitle title={"食券呼び出し"}></PageTitle>
                <div className={"flex flex-col items-center justify-center"}>
                    <Loader></Loader>
                </div>
            </div>
        )
    }
    return (
        <div>
            <PageTitle title={"食券呼び出し"}></PageTitle>
            <div className={"flex flex-col items-center justify-center"}>
                呼び出しました!
            </div>
        </div>
    )
}