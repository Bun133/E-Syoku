"use client"

import PageTitle from "@/components/pageTitle";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useParams} from "next/navigation";
import React from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import Button from "@/components/button";
import {Card, Col, Divider, Grid, Subtitle, Text, Title} from "@tremor/react";

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
                <Grid numItemsSm={6} numItemsMd={8} numItemsLg={12}>
                    <Col numColSpanSm={1} numColSpanMd={2} numColSpanLg={3}></Col>
                    <Col numColSpan={4} numColSpanMd={4} numColSpanLg={6}>
                        <div>
                            <Card>
                                <Subtitle>食券番号</Subtitle>
                                <Title>{ticket.ticketNum}</Title>
                                <Divider/>
                                <Text>Status : {data?.data?.ticket?.status}</Text>
                                <Text>Description : {data?.data?.ticket?.description}</Text>
                                <Text>UniqueId : {data?.data?.ticket?.uniqueId}</Text>
                                <Text>ShopId : {data?.data?.ticket?.shopId}</Text>
                            </Card>

                            <div className={"flex flex-col items-center justify-center mt-10"}>
                                <Button onClick={() => reload()}>再読み込み</Button>
                            </div>
                        </div>
                    </Col>
                    <Col numColSpanSm={1} numColSpanMd={2} numColSpanLg={3}></Col>
                </Grid>
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