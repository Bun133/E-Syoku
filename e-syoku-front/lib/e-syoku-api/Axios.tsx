"use client"

import {ZodType} from "zod";
import {defaultResponseFormat, DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import {useEffect, useRef, useState} from "react";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {User} from "@firebase/auth";

export type EndPoint<Q, R extends DefaultResponseFormat> = {
    endpointPath: string,
    requestType: ZodType<Q>,
    responseType: ZodType<R>
}

export function endpoint<Q, R extends DefaultResponseFormat>(endpointPath: string, requestType: ZodType<Q>, responseType: ZodType<R>): EndPoint<Q, R> {
    return {endpointPath: endpointPath, requestType: requestType, responseType: responseType}
}

type EndPointBaseResponse<R extends DefaultResponseFormat> = {
    // defaultResponseFormatでもparse出来なかった
    parseFailed: boolean,
    // fetch中にerrorがthrowされた
    fetchFailed: boolean,
}

export type EndPointSuccessResponse<R extends DefaultResponseFormat> = {
    data: R,
    success: string | undefined
    // 正常にparseできたときのAPIResponseのisSuccess
    // 正常にparse出来なかったときはfalse
    // defaultResponseFormatでparse出来てもfalse
    isSuccess: true,
} & EndPointBaseResponse<R>
export type EndPointErrorResponse<R extends DefaultResponseFormat> = {
    data: undefined,
    error: string,
    errorCode: string,
    // 正常にparseできたときのAPIResponseのisSuccess
    // 正常にparse出来なかったときはfalse
    // defaultResponseFormatでparse出来てもfalse
    isSuccess: false,
    stack: string | undefined
} & EndPointBaseResponse<R>

export type EndPointResponse<R extends DefaultResponseFormat> = EndPointSuccessResponse<R> | EndPointErrorResponse<R>

// Fetchのタイミング
export type TimingOption = {
    // 最大試行回数
    retryMaximum: number,
    // 再試行まで開ける時間(ms)
    retryDelay: number,
    // 再試行するかどうか
    determineRetry: (response: EndPointResponse<any>) => boolean
}

let apiEndpointPrefix = process.env.NEXT_PUBLIC_apiEndpointPrefix
let apiEndpointSuffix = process.env.NEXT_PUBLIC_apiEndpointSuffix

export async function callEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, user: User | undefined, requestData: Q, abortController?: AbortController, timingOptions?: TimingOption): Promise<EndPointResponse<R>> {
    let r: EndPointResponse<R>
    r = await internalCallEndpoint(endPoint, user, requestData, abortController)
    console.log("[callEndpoint:Request]", requestData)
    console.log("[callEndpoint:Response]", r)

    if (timingOptions && timingOptions.retryMaximum > 1) {
        for (let i = 0; i < timingOptions.retryMaximum - 1; i++) {
            if (!timingOptions.determineRetry(r)) {
                break
            }

            // wait for retryDelay
            await new Promise(resolve => setTimeout(resolve, timingOptions.retryDelay))

            console.log(`[callEndpoint:Retry] Retrying ${i + 1} times`)
            r = await internalCallEndpoint(endPoint, user, requestData, abortController)
            console.log("[callEndpoint:Request]", requestData)
            console.log("[callEndpoint:Response]", r)
        }
    }

    return r
}

async function internalCallEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, user: User | undefined, requestData: Q, abortController?: AbortController): Promise<EndPointResponse<R>> {
    let fullPath = (apiEndpointPrefix ?? "") + endPoint.endpointPath + (apiEndpointSuffix ?? "")
    console.log("full path", fullPath)
    if (user == undefined) {
        return {
            data: undefined,
            error: "No user instance",
            errorCode: "[Client]NO_USER_INSTANCE",
            parseFailed: false,
            fetchFailed: false,
            isSuccess: false,
            stack: undefined
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
            errorCode: "[Client]FETCH_FAILED",
            parseFailed: false,
            fetchFailed: true,
            isSuccess: false,
            stack: e.stack ?? "No stack"
        }
    }

    const json = await data.json()
    let parsed = await endPoint.responseType.safeParseAsync(json)
    if (parsed.success) {
        // Success parsing
        if (parsed.data.isSuccess) {
            // Success Response
            const r: EndPointSuccessResponse<R> = {
                data: parsed.data,
                success: parsed.data.success,
                parseFailed: false,
                fetchFailed: false,
                isSuccess: parsed.data.isSuccess
            }
            return r
        } else {
            // Failed Response
            const r: EndPointErrorResponse<R> = {
                data: undefined,
                error: parsed.data.error,
                errorCode: parsed.data.errorCode,
                parseFailed: false,
                fetchFailed: false,
                isSuccess: parsed.data.isSuccess,
                stack: parsed.data.stack
            }
            return r
        }
    } else {
        console.log("[Client]Parse Error:", parsed.error)
        // Failed to parse,but still be able to parse as DefaultResponseFormat
        console.log("Try parsing DefaultResponseFormat")
        const defaultParsed = await defaultResponseFormat.safeParseAsync(json)
        if (defaultParsed.success) {
            // Success parsing as DefaultResponseFormat
            console.log("Success Fallback Parsing")
            if (defaultParsed.data.isSuccess) {
                // TODO このパターンが謎
                const r: EndPointErrorResponse<R> = {
                    data: undefined,
                    error: "正常にレスポンスを得られませんでした",
                    errorCode: "[Client]SUCCESS_FALLBACK_PARSING",
                    parseFailed: false,
                    fetchFailed: false,
                    isSuccess: false,
                    stack: "No stack"
                }
                return r
            } else {
                const r: EndPointErrorResponse<R> = {
                    data: undefined,
                    parseFailed: false,
                    errorCode: defaultParsed.data.errorCode,
                    error: defaultParsed.data.error,
                    fetchFailed: false,
                    isSuccess: false,
                    stack: defaultParsed.data.stack
                }
                return r
            }
        } else {
            // failed fallback parsing as DefaultResponseFormat
            console.log("Endpoint Fallback Parsing Failed")
            const r: EndPointErrorResponse<R> = {
                data: undefined,
                error: "正常にレスポンスを得られませんでした",
                errorCode: "[Client]ENDPOINT_FALLBACK_PARSING_FAILED",
                parseFailed: true,
                fetchFailed: false,
                isSuccess: false,
                stack: "No stack"
            }
            return r
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
    const isRequestPending = useRef(false)
    const [isLoaded, setLoaded] = useState(false)
    const isHandledFirstReq = useRef(false)

    const call = () => {
        if (token.user == undefined) {
            // 見なかったことにする
            return
        }
        isRequestPending.current = true
        callEndpoint(endPoint, token.user, requestData).then(data => {
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
            isRequestPending.current = false
        })
    }

    const fetch = () => {
        if (isRequestPending.current) {
            // ignore new request
            console.log("Ignore new request")
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

    const call: ((q: Q) => Promise<EndPointResponse<R> | undefined>) = async (requestData: Q) => {
        if (token.user == undefined) {
            // 見なかったことにする
            return undefined
        }
        isRequestPending.current = true
        try {
            const data = await callEndpoint(endPoint, token.user, requestData, abort.current)
            console.log("SET", data)
            setResponse(data)
            setLoaded(true)
            isRequestPending.current = false
            return data
        } catch (e: unknown) {
            console.log("ERROR", e)
            isRequestPending.current = false
            const err: EndPointErrorResponse<R> = {
                data: undefined,
                error: "接続が中断されました",
                errorCode: "[Client]CONNECTION_LOST",
                fetchFailed: true,
                isSuccess: false,
                parseFailed: false,
                // @ts-ignore
                rawError: e
            }
            return err
        }
    }

    const fetch: ((q: Q) => Promise<EndPointResponse<R> | undefined>) = async (requestData: Q) => {
        if (isRequestPending.current) {
            // abort previous request
            abort.current.abort()
            console.log("Aborting previous request")
        }
        setLoaded(false)
        return call(requestData)
    }

    const firstCall: ((q: Q) => Promise<EndPointResponse<R> | undefined>) = async (requestData: Q) => {
        if (!isFirstReqSent.current) {
            // Send first request
            const data = await fetch(requestData)
            isFirstReqSent.current = true
            return data
        }
        return undefined
    }

    return {response, isLoaded, fetch: fetch, firstCall}
}