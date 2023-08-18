"use client"

import {useEffect} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

type Dict = {
    [key: string]: any
}

export function useSavedState<T extends Dict>(paramName: string, defaultValue?: T, paramChange?: (t: T | undefined) => void): [T | undefined, (toChange: T) => void] {
    const params = useSearchParams()
    const param = params.get(paramName) ?? undefined
    const router = useRouter()
    const pathName = usePathname()

    useEffect(() => {
        onParamChange(param)
    }, [param])

    function parse(str: string) {
        try {
            return JSON.parse(str)
        } catch (e) {
            return undefined
        }
    }

    function currentValue(): T | undefined {
        if (param) {
            return parse(param)
        }

        return defaultValue
    }

    function isDifferFromState(str: string | undefined) {
        const state = currentValue()
        if (state !== undefined && str !== undefined) {
            return JSON.stringify(state) !== str
        }

        return !(state === undefined && str === undefined)
    }

    function onParamChange(str: string | undefined) {
        console.log("onParamChange")
        const diff = isDifferFromState(str)
        console.log("diff", diff)
        if (diff) {
            let state: T | undefined
            if (str) {
                state = parse(str)
            }

            newState(state)
            paramChange?.(state)
        }
    }

    function newState(toChange: T | undefined) {
        const newParam = new URLSearchParams(Array.from(params.entries()))
        if (toChange) {
            newParam.set(paramName, JSON.stringify(toChange))
        } else {
            newParam.delete(paramName)
        }

        const newParamStr = newParam.toString()
        const query = newParamStr === "" ? "" : `?${newParamStr}`

        const newPathName = `${pathName}${query}`
        router.replace(newPathName)
    }

    return [currentValue(), newState]
}