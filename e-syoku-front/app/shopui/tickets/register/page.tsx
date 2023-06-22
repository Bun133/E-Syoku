"use client"

import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {registerTicketEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {useRef} from "react";
import Button from "@/components/button";

export default function () {
    const params = useSearchParams()
    const shopId = params.get("sid")
    const ticketNum = params.get("tnum")
    const description = params.get("desc")


    if (shopId == null || ticketNum == null) {
        return (
            <div>
                <PageTitle title={"エラー"}></PageTitle>
                パラメータの指定が違います
            </div>
        )
    } else {
        // TODO ifの下に書くべきではない
        const send = useRef(false)
        const {response: data, isLoaded, fetch: post} = useEndpoint(registerTicketEndPoint, {
            shopId: shopId,
            ticketNum: ticketNum,
            description: description == null ? undefined : description
        })

        if (send.current && isLoaded) {
            if (data?.error) {
                return (
                    <div>
                        <PageTitle title={"食券登録失敗"}></PageTitle>
                        食券登録に失敗しました

                        {JSON.stringify(data?.error)}
                    </div>
                )
            }
            return (
                <div>
                    <PageTitle title={"食券登録完了"}></PageTitle>
                    食券の登録が完了しました

                    {data?.data?.ticket !== undefined ? JSON.stringify(data?.data?.ticket!!) : null}
                </div>
            )
        } else {
            return (
                <div>
                    <PageTitle title={"食券登録"}></PageTitle>
                    以下の内容で登録します

                    ShopId: {shopId}
                    TicketNum: {ticketNum}
                    Description: {description}

                    <Button onClick={() => {
                        send.current = true;
                        post()
                    }}>
                        登録
                    </Button>
                </div>
            )
        }
    }
}