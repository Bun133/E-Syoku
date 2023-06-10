"use client"

import {ZodType} from "zod";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";

export type EndPoint<Q, R> = {
    endpointPath: string,
    requestType: ZodType<Q>,
    responseType: ZodType<R>
}

export function endpoint(endpointPath: string, requestType: ZodType<any>, responseType: ZodType<any>) {
    return {endpointPath: endpointPath, requestType: requestType, responseType: responseType}
}

export type EndPointResponse<R extends DefaultResponseFormat> = {
    data: R | undefined,
    error: string | undefined,
    success: string | undefined,
    parseFailed: boolean,
    isSuccess: boolean,
}

const apiEndpointPrefix = process.env.NEXT_PUBLIC_apiEndpoint

export async function useEndpoint<Q, R extends DefaultResponseFormat>(endPoint: EndPoint<Q, R>, requestData: any): Promise<EndPointResponse<R>> {
    let fullPath = apiEndpointPrefix !== undefined ? apiEndpointPrefix + endPoint.endpointPath : endPoint.endpointPath

    const data = await fetch(fullPath, {
        cache: "no-cache",
        method: "POST",
    })

    let parsed = await endPoint.responseType.safeParseAsync(data)
    if (parsed.success) {
        return {
            data: parsed.data,
            error: parsed.data.error,
            success: parsed.data.success,
            parseFailed: false,
            isSuccess: parsed.data.isSuccess,
        }
    } else {
        return {
            data: undefined,
            error: parsed.error.message,
            success: undefined,
            parseFailed: true,
            isSuccess: false,
        }
    }
}