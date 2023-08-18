"use client"

import {useEffect, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

type Dict = {
    [key: string]: any
}

export function useSavedState<T extends Dict>(paramName: string, defaultValue?: T): [T | undefined, (toChange: T) => void] {
    const [state, setState] = useState<T | undefined>(defaultValue)

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

    function isDifferFromState(str: string | undefined) {
        if (state !== undefined && str !== undefined) {
            return JSON.stringify(state) !== str
        }

        return !(state === undefined && str === undefined)
    }

    function onParamChange(str: string | undefined) {
        if (isDifferFromState(str)) {
            if (str) {
                setState(parse(str))
            } else {
                setState(undefined)
            }
        }
    }

    function newState(toChange: T) {
        setState(toChange)
        const newParam = new URLSearchParams(Array.from(params.entries()))
        newParam.set(paramName, JSON.stringify(toChange))

        const newParamStr = newParam.toString()
        const query = newParamStr === "" ? "" : `?${newParamStr}`

        const newPathName = `${pathName}${query}`
        router.replace(newPathName)
    }

    return [state, newState]
}