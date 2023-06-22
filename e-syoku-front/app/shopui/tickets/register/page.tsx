"use client"

import PageTitle from "@/components/pageTitle";
import React, {useRef} from "react";
import {callEndpoint, useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listShopsEndPoint, registerTicketEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Loader} from "react-feather";
import ListSelection from "@/components/form/ListSelection";
import {ShopDetail} from "@/lib/e-syoku-api/Types";
import {StringInput} from "@/components/form/StringInput";
import Button from "@/components/button";
import {useFirebaseAuth} from "@/lib/firebase/authentication";

export default function () {
    const {response: shops, isLoaded} = useEndpoint(listShopsEndPoint, {})
    const selectedShop = useRef<ShopDetail>()
    const ticketId = useRef<string>()
    const description = useRef<string>()
    const token = useFirebaseAuth()

    if (!isLoaded || shops == undefined) {
        return (
            <div>
                <PageTitle title={"食券新規登録"}></PageTitle>
                <div className={"flex justify-center items-center h-max"}>
                    <Loader></Loader>
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageTitle title={"食券新規登録"}></PageTitle>
            <div className={"flex flex-col gap-4 px-40"}>
                <ListSelection values={shops.data!!.shops.map(shop => {
                    return {name: shop.name, value: shop}
                })} selected={(selected) => {
                    console.log("selected", selected)
                    selectedShop.current = selected.value
                }}></ListSelection>

                <StringInput onChange={(value) => {
                    ticketId.current = value
                }} placeholder={"TicketID"}></StringInput>

                <StringInput onChange={(value) => {
                    description.current = value
                }} placeholder={"Description"}></StringInput>

                <Button onClick={() => {
                    if (!ticketId.current) return
                    callEndpoint(registerTicketEndPoint, token, {
                        shopId: selectedShop.current!!.shopId,
                        ticketNum: ticketId.current,
                        description: description.current
                    }).then(res => {
                        console.log("response", res)
                    })
                }}>送信</Button>
            </div>
        </div>
    )
}