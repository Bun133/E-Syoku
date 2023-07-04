"use client"

import {ZodType} from "zod";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import React, {useCallback, useEffect, useState} from "react";
import {FirebaseAuthContextType, useFirebaseAuth} from "@/lib/firebase/authentication";

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

export async function callEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, token: FirebaseAuthContextType, requestData: Q): Promise<EndPointResponse<R>> {
    let fullPath = apiEndpointPrefix !== undefined ? apiEndpointPrefix + endPoint.endpointPath : endPoint.endpointPath
    console.log("full path", fullPath)
    const tokenString = await (token.auth?.currentUser?.getIdToken(true))
    console.log("token", tokenString)
    let data: Response
    try {
        data = await fetch(fullPath, {
            cache: "no-store",
            method: "POST",
            body: JSON.stringify(requestData),
            headers: {
                "Content-Type": "application/json",
                // TODO token取得出来なければ、headerに含めない
                "Authorization": tokenString !== undefined ? "Bearer " + tokenString : "",
            },
            mode: "cors",
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

    const call = () => {
        callEndpoint(endPoint, token, requestData).then(data => {
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
        })
    }


    const [isLoaded, setLoaded] = useState(false)
    useEffect(() => {
        if (option === undefined || option?.callOnMount) {
            if (isLoaded) return
            call()
        }
    }, [])

    const fetch = useCallback(() => {
        setLoaded(false)
        call()
    }, [])

    return {response, isLoaded, fetch}
}