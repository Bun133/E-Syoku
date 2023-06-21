"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useParams} from "next/navigation";
import React from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import Button from "@/components/button";

export default function Page() {

    const param = useParams()
    const id = param["id"]!!

    const {response: data, isLoaded, fetch: reload} = useEndpoint(ticketStatusEndPoint, {ticketId: id})
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
                <div
                    className={"h-max p-3 mx-2 shadow-2xl rounded-2xl flex flex-col justify-center items-start"}>
                    <div
                        className={"w-full py-5 my-2 flex flex-col items-center justify-center bg-gray-100 rounded-2xl space-y-1"}>
                        <div className={""}>食券番号</div>
                        <div className={"font-bold text-xl"}>{ticket.ticketNum}</div>
                    </div>
                    <div>Status : {data?.data?.ticket?.status}</div>
                    <div>Description : {data?.data?.ticket?.description}</div>
                    <div>UniqueId : {data?.data?.ticket?.uniqueId}</div>
                    <div>ShopId : {data?.data?.ticket?.shopId}</div>
                </div>
                <div className={"flex flex-col items-center justify-center mt-10"}>
                    <Button onClick={() => reload()}>再読み込み</Button>
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