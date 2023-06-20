"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useParams} from "next/navigation";
import React from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";

export default function Page() {

    const param = useParams()
    const id = param["id"]!!

    const data = useEndpoint(ticketStatusEndPoint, {ticketId: id})
    const ticket = data?.data?.ticket

    if (ticket !== undefined) {
        return (
            <div>
                <PageTitle title={"食券番号 " + ticket.ticketNum}></PageTitle>
                <div
                    className={"w-full h-max p-3 mx-2 shadow-2xl rounded-2xl flex flex-col justify-center items-start"}>
                    <div
                        className={"w-full py-5 m-2 flex flex-col items-center justify-center bg-gray-100 rounded-2xl space-y-1"}>
                        <div className={""}>食券番号</div>
                        <div className={"font-bold text-xl"}>{ticket.ticketNum}</div>
                    </div>
                    <div>只今準備中です。呼び出しまでお待ちください。</div>
                    <div>注文内容：</div>
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