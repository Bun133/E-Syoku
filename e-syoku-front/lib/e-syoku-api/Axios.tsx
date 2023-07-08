"use client"

import {ZodType} from "zod";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import React, {useEffect, useRef, useState} from "react";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {User} from "@firebase/auth";

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

let apiEndpointPrefix = process.env.NEXT_PUBLIC_apiEndpoint

export async function callEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, user: User | undefined, requestData: Q, abortController?: AbortController): Promise<EndPointResponse<R>> {
    let fullPath = apiEndpointPrefix !== undefined ? apiEndpointPrefix + endPoint.endpointPath : endPoint.endpointPath
    console.log("full path", fullPath)
    if (user == undefined) {
        return {
            data: undefined,
            error: "No user instance",
            success: undefined,
            parseFailed: false,
            fetchFailed: false,
            isSuccess: false,
        }
    }
    const tokenString = await (user.getIdToken(true))
    console.log("token", tokenString)
    let data: Response
    try {
        data = await fetch(fullPath, {
            cache: "no-store",
            method: "POST",
            body: JSON.stringify(requestData),
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + tokenString
            },
            mode: "cors",
            signal: abortController ? abortController.signal : undefined
        })
    } catch (e: any) {
        return {
            data: undefined,
            error: e.message ?? "Unknown Error",
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

export type useEndPointOption = {
    // if true, call the endpoint on mount
    callOnMount?: boolean,
}

export function useEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, requestData: Q, option?: useEndPointOption): {
    response: EndPointResponse<R> | undefined;
    fetch: () => void;
    isLoaded: boolean
} {
    const token = useFirebaseAuth()

    const [response, setResponse] = useState<EndPointResponse<R> | undefined>(undefined)
    const abort = useRef(new AbortController())
    const isRequestPending = useRef(false)
    const [isLoaded, setLoaded] = useState(false)
    const isHandledFirstReq = useRef(false)

    const call = () => {
        if (token.user == undefined) {
            // 見なかったことにする
            return
        }
        isRequestPending.current = true
        callEndpoint(endPoint, token.user, requestData, abort.current).then(data => {
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
            isRequestPending.current = false
        })
    }

    const fetch = () => {
        if (isRequestPending.current) {
            // abort previous request
            abort.current.abort()
            console.log("Aborting previous request")
        }
        setLoaded(false)
        call()
    }


    useEffect(() => {
        if (!isHandledFirstReq && (option === undefined || option?.callOnMount)) {
            // first fetch
            fetch()
        } else if (isHandledFirstReq) {
            // re-fetch
            fetch()
        }
        isHandledFirstReq.current = true
    }, [token.user])

    return {response, isLoaded, fetch: fetch}
}

export function useLazyEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>) {
    const token = useFirebaseAuth()
    const [response, setResponse] = useState<EndPointResponse<R> | undefined>(undefined)
    const [isLoaded, setLoaded] = useState(false)
    const abort = useRef(new AbortController())
    const isRequestPending = useRef(false)
    const isFirstReqSent = useRef(false)

    const call = (requestData: Q) => {
        if (token.user == undefined) {
            // 見なかったことにする
            return
        }
        isRequestPending.current = true
        callEndpoint(endPoint, token.user, requestData, abort.current).then(data => {
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
            isRequestPending.current = false
        })
    }

    const fetch = (requestData: Q) => {
        if (isRequestPending.current) {
            // abort previous request
            abort.current.abort()
            console.log("Aborting previous request")
        }
        setLoaded(false)
        call(requestData)
    }

    const firstCall = (requestData: Q) => {
        if (!isFirstReqSent.current) {
            // Send first request
            fetch(requestData)
            isFirstReqSent.current = true
        }
    }

    return {response, isLoaded, fetch: fetch, firstCall}
}