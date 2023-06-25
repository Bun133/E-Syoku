"use client"

import PageTitle from "@/components/pageTitle";
import {useParams} from "next/navigation";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {callTicketEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Loader} from "react-feather";

export default function () {
    const param = useParams()
    const ticketUniqueId = param.id
    if (!ticketUniqueId) {
        return (
            <div>
                <PageTitle title={"取得失敗"}></PageTitle>
                情報取得に失敗しました。もう一度お試しください。
            </div>
        )
    }

    const {response: data} = useEndpoint(callTicketEndPoint, {ticketId: ticketUniqueId}, {callOnMount: true})
    if (!data) {
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