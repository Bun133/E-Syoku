"use client"

import React, {useEffect, useRef, useState} from "react";
import PageTitle from "@/components/pageTitle";
import {useParams} from "next/navigation";
import {callEndpoint, EndPointResponse} from "@/lib/e-syoku-api/Axios";
import {ticketStatusEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {TicketStatusResponse} from "@/lib/e-syoku-api/Types";

export default function Page() {
    const param = useParams()
    const id = param["id"]

    const [res, setRes] = useState<EndPointResponse<TicketStatusResponse> | null>(null)
    const isLoaded = useRef(false)

    if (!isLoaded.current) {
        callEndpoint(ticketStatusEndPoint, {id: "JAQze9bOcHT3FsO9djf2"}).then(res => {
            console.log("data", res)
            setRes(res)
        })
        isLoaded.current = true
    }


    const renderCount = useRef(0)

    renderCount.current = renderCount.current + 1
    console.log("renders", renderCount.current)

    const [toggle, setToggle] = useState(false)
    useEffect(() => {
        console.log("toggle", toggle)
        return () => {
            console.log("cleanup")
        }
    }, [toggle])

    // useEffect(() => {
    //     console.log("res", res)
    //     return () => {
    //         console.log("cleanup")
    //     }
    // }, [res])

    if (toggle) {
        return (
            <>
                <PageTitle title={"" + toggle}></PageTitle>
                ON!
                <button onClick={() => setToggle(!toggle)}>toggle</button>
            </>
        )
    } else {
        return (
            <>
                <PageTitle title={"" + toggle}></PageTitle>
                OFF!
                <button onClick={() => setToggle(!toggle)}>toggle</button>
            </>
        )
    }
}