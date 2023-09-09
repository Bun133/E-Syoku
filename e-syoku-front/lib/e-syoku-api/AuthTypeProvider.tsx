import {authType, AuthType} from "@/lib/e-syoku-api/Types";
import {z} from "zod";
import {authStateEndpoint} from "@/lib/e-syoku-api/EndPoints";
import React, {createContext, useEffect, useState} from "react";
import {useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {useFirebaseAuth} from "@/lib/firebase/authentication";

export const AuthTypeInfoSchema = z.object({
    authType: authType.optional()
})

export type AuthTypeInfo = z.infer<typeof AuthTypeInfoSchema>

export const authTypeContext = createContext<AuthTypeInfo | null>(null)

export const AuthTypeProvider = (params: { children: React.ReactNode }) => {
    const {fetch} = useLazyEndpoint(authStateEndpoint)
    const [value, setValue] = useState<AuthTypeInfo>()
    const {user} = useFirebaseAuth()
    useEffect(() => {
        // mark this hook depends on useFirebaseAuth
        // if user changes,re-fetch authState.
        if (user === undefined) {
            setValue(undefined)
        } else {
            fetch({}).then((data) => {
                if (data) {
                    if (data.isSuccess) {
                        setValue({authType: data.data.authType})
                    } else {
                        setValue({authType: undefined})
                    }
                }
            }).catch(() => {
                setValue(undefined)
            })
        }
    }, [user])

    return <authTypeContext.Provider value={value ?? null}>{params.children}</authTypeContext.Provider>
}

export function useAuthState() {
    return React.useContext(authTypeContext);
}

export function AuthState(params: { comp: (info: AuthTypeInfo | undefined) => React.JSX.Element | React.JSX.Element[] | null }) {
    const info = useAuthState()
    return (
        <>
            {params.comp(info ?? undefined)}
        </>
    )
}

export function Authed(params: {
    types: AuthType[],
    success: (type: AuthType) => React.JSX.Element | React.JSX.Element[] | null,
    fail?: (type: AuthType | undefined) => React.JSX.Element | React.JSX.Element[] | null,
    notLoaded?: () => React.JSX.Element | React.JSX.Element[] | null
}) {
    const failComp = params.fail ?? ((type: AuthType | undefined) => null)
    return (
        <AuthState comp={(info) => {
            if (info === undefined || info.authType === undefined) {
                return params.notLoaded?.() ?? null
            } else {
                const type = info.authType
                if (params.types.includes(type)) {
                    return params.success(type)
                } else {
                    return failComp(type)
                }
            }
        }}/>
    )
}

export function AdminOnly(params: { children: React.JSX.Element | React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element | React.JSX.Element[] | null }) {
    return (
        <Authed types={["ADMIN"]} success={() => params.children} fail={params.fail}/>
    )
}

export function ShopOnly(params: { children: React.JSX.Element | React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element | React.JSX.Element[] | null }) {
    return (
        <Authed types={["SHOP", "ADMIN"]} success={() => params.children} fail={params.fail}/>
    )
}

export function CashierOnly(params: { children: React.JSX.Element | React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element | React.JSX.Element[] | null }) {
    return (
        <Authed types={["CASHIER", "ADMIN"]} success={() => params.children} fail={params.fail}/>
    )
}