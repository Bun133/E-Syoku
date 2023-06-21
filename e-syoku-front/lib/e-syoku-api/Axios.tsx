"use client"

import {ZodType} from "zod";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import React, {useEffect, useState} from "react";

export type EndPoint<Q, R> = {
    endpointPath: string,
    requestType: ZodType<Q>,
    responseType: ZodType<R>
}

export function endpoint<Q, R>(endpointPath: string, requestType: ZodType<Q>, responseType: ZodType<R>): EndPoint<Q, R> {
    return {endpointPath: endpointPath, requestType: requestType, responseType: responseType}
}

export type EndPointResponse<R extends DefaultResponseFormat> = {
    data: R | undefined,
    error: string | undefined,
    success: string | undefined,
    parseFailed: boolean,
    fetchFailed: boolean,
    isSuccess: boolean,
}

// const apiEndpointPrefix = process.env.NEXT_PUBLIC_apiEndpoint
const apiEndpointPrefix = "http://127.0.0.1:5001/e-syoku/asia-northeast1/"

export async function callEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, requestData: {
    [key: string]: string
}): Promise<EndPointResponse<R>> {
    let fullPath = apiEndpointPrefix !== undefined ? apiEndpointPrefix + endPoint.endpointPath : endPoint.endpointPath
    console.log("full path", fullPath)
    const data = await fetch(fullPath, {
        cache: "no-store",
        method: "POST",
        body: JSON.stringify(requestData),
        headers: {
            "Content-Type": "application/json"
        },
        mode: "cors",
    })

    if (!data.ok) {
        console.log("Error:", data.status)
        return {
            data: undefined,
            error: data.statusText,
            success: undefined,
            parseFailed: false,
            fetchFailed: true,
            isSuccess: false,
        }
    }


    let parsed = await endPoint.responseType.safeParseAsync(await data.json())
    if (parsed.success) {
        console.log("Parsed", parsed.data)
        return {
            data: parsed.data,
            error: parsed.data.error,
            success: parsed.data.success,
            parseFailed: false,
            fetchFailed: false,
            isSuccess: parsed.data.isSuccess,
        }
    } else {
        console.log("Endpoint Error:", parsed.error.message)
        return {
            data: undefined,
            error: parsed.error.message,
            success: undefined,
            parseFailed: true,
            fetchFailed: false,
            isSuccess: false,
        }
    }
}

export function useEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, requestData: {
    [key: string]: string
}): { response: EndPointResponse<R> | undefined; isLoaded: boolean } {
    const [response, setResponse] = useState<EndPointResponse<R> | undefined>(undefined)

    const call = () => {
        callEndpoint(endPoint, requestData).then(data => {
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
        })
    }


    const [isLoaded, setLoaded] = useState(false)
    useEffect(() => {
        if (isLoaded) return
        call()
    }, [])

    return {response, isLoaded}
}