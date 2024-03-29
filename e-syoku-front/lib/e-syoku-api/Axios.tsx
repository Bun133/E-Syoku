"use client"

import {ZodType} from "zod";
import {defaultResponseFormat, DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import {useState} from "react";
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
export type EndPointError = {
    error: string,
    errorCode: string,
    // 正常にparseできたときのAPIResponseのisSuccess
    // 正常にparse出来なかったときはfalse
    // defaultResponseFormatでparse出来てもfalse
    isSuccess: false,
    stack?: string
}
export type EndPointErrorResponse<R extends DefaultResponseFormat> = {
    data: undefined,
    error: EndPointError,
    errors: EndPointError[],
    isSuccess: false
} & EndPointBaseResponse<R>

export type EndPointResponse<R extends DefaultResponseFormat> = EndPointSuccessResponse<R> | EndPointErrorResponse<R>

let apiEndpointPrefix = process.env.NEXT_PUBLIC_apiEndpointPrefix
let apiEndpointSuffix = process.env.NEXT_PUBLIC_apiEndpointSuffix

export async function callEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, user: User, requestData: Q, abortController?: AbortController): Promise<EndPointResponse<R>> {
    let r: EndPointResponse<R>
    r = await internalCallEndpoint(endPoint, user, requestData, abortController)
    console.log("[callEndpoint:Request]", requestData)
    console.log("[callEndpoint:Response]", r)
    return r
}

async function internalCallEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, user: User, requestData: Q, abortController?: AbortController): Promise<EndPointResponse<R>> {
    let fullPath = (apiEndpointPrefix ?? "") + endPoint.endpointPath + (apiEndpointSuffix ?? "")
    if (user == undefined) {
        return {
            data: undefined,
            error: {
                isSuccess: false,
                error: "No user instance",
                errorCode: "[Client]NO_USER_INSTANCE",
            },
            errors: [],
            parseFailed: false,
            fetchFailed: false,
            isSuccess: false,
        }
    }
    const tokenString = await (user.getIdToken(false))
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
            error: {
                isSuccess: false,
                stack: e.stack ?? "No stack",
                error: e.message ?? "Unknown Error",
                errorCode: "[Client]FETCH_FAILED",
            },
            errors: [],
            parseFailed: false,
            fetchFailed: true,
            isSuccess: false,
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
                errors: parsed.data.errors,
                parseFailed: false,
                fetchFailed: false,
                isSuccess: parsed.data.isSuccess,
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
                    error: {
                        isSuccess: false,
                        error: "正常にレスポンスを得られませんでした",
                        errorCode: "[Client]SUCCESS_FALLBACK_PARSING",
                    },
                    errors: [],
                    parseFailed: false,
                    fetchFailed: false,
                    isSuccess: false,
                }
                return r
            } else {
                const r: EndPointErrorResponse<R> = {
                    data: undefined,
                    parseFailed: false,
                    error: defaultParsed.data.error,
                    errors: defaultParsed.data.errors,
                    fetchFailed: false,
                    isSuccess: false,
                }
                return r
            }
        } else {
            // failed fallback parsing as DefaultResponseFormat
            console.log("Endpoint Fallback Parsing Failed")
            const r: EndPointErrorResponse<R> = {
                data: undefined,
                error: {
                    isSuccess: false,
                    error: "正常にレスポンスを得られませんでした",
                    errorCode: "[Client]ENDPOINT_FALLBACK_PARSING_FAILED",
                },
                errors: [],
                parseFailed: true,
                fetchFailed: false,
                isSuccess: false,
            }
            return r
        }
    }
}

export function useLazyEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>) {
    const token = useFirebaseAuth()
    const [response, setResponse] = useState<EndPointResponse<R> | undefined>(undefined)
    const [isLoaded, setLoaded] = useState(false)

    async function fetch(q: Q): Promise<EndPointResponse<R>> {
        setLoaded(false)
        // wait until token.user is loaded
        const user = await token.waitForUser()

        const r = await callEndpoint(endPoint, user, q)
        setLoaded(true)
        setResponse(r)
        return r
    }

    return {response, isLoaded, fetch: fetch}
}