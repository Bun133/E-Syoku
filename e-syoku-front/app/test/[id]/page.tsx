"use client"

import React, {useEffect, useRef, useState} from "react";
import PageTitle from "@/components/pageTitle";
import {EndPoint} from "@/lib/e-syoku-api/Axios";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {useParams} from "next/navigation";

export default function Page() {

    const r = useObject({id: "JAQze9bOcHT3FsO9djf2"})
    const param = useParams()
    const id = param["id"]

    const api = useAPI(ticketStatusEndPoint, {ticketId: id})
    const ticket = api?.ticket

    console.log("renders")

    if (ticket !== undefined) {
        return (
            <div>
                <PageTitle title={"Ticket Status" + ticket.ticketNum}/>
                {id}
                {JSON.stringify(ticket)}
            </div>
        )
    } else {
        return (
            <div>
                <PageTitle title={"Ticket Status"}/>
                {id}
            </div>
        )
    }

}

type Obj<R> = {
    data: R | undefined
}

function useObject<R extends Object>(initValue: R): Obj<R> {
    const [r, setR] = useState<R>()

    const delayedAsync = async () => {
        await new Promise(resolve => setTimeout(resolve, 1))
        setR(initValue)
    }

    const isRun = useRef(false)
    useEffect(() => {
        if (isRun.current) return
        isRun.current = true
        console.log("useEffect")
        delayedAsync()
    }, [])

    return {data: r}
}

export function useAPI<Q, R extends DefaultResponseFormat>(endpoint: EndPoint<Q, R>, req: Q) {
    const [r, setR] = useState<R>()

    const update = async () => {
        const data = await fetch("http://127.0.0.1:5001/e-syoku/asia-northeast1/" + endpoint.endpointPath, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req)
        })

        const json = await data.json()
        const parsed = await endpoint.responseType.parseAsync(json)
        setR(parsed)
    }


    useEffect(() => {
        update()
    }, [])

    return r
}