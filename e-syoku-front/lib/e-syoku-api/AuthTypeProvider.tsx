import {authType, AuthType} from "@/lib/e-syoku-api/Types";
import {z} from "zod";
import {authStateEndpoint} from "@/lib/e-syoku-api/EndPoints";
import React, {createContext} from "react";
import {useEndpoint} from "@/lib/e-syoku-api/Axios";

export const AuthTypeInfoSchema = z.object({
    authType: authType.optional()
})

export type AuthTypeInfo = z.infer<typeof AuthTypeInfoSchema>

export const authTypeContext = createContext<AuthTypeInfo | null>(null)

export const AuthTypeProvider = (params: { children: React.ReactNode }) => {
    const {response: data, fetch: reload} = useEndpoint(authStateEndpoint, {})
    if (data) {
        if (data.isSuccess) {
            return <authTypeContext.Provider
                value={{authType: data.data.authType}}>{params.children}</authTypeContext.Provider>
        } else {
            reload()
            return <authTypeContext.Provider value={{authType: undefined}}>{params.children}</authTypeContext.Provider>
        }
    }
    return <authTypeContext.Provider value={null}>{params.children}</authTypeContext.Provider>
}

export function useAuthState() {
    return React.useContext(authTypeContext);
}

export function AuthState(params: { children: (info: AuthTypeInfo | undefined) => React.JSX.Element |React.JSX.Element[] | null }) {
    const info = useAuthState()
    return (
        <>
            {params.children(info ?? undefined)}
        </>
    )
}

export function Authed(params: {
    types: AuthType[],
    success: (type: AuthType) => React.JSX.Element |React.JSX.Element[] | null,
    fail?: (type: AuthType | undefined) => React.JSX.Element |React.JSX.Element[] | null
}) {
    const failComp = params.fail ?? ((type: AuthType | undefined) => null)
    return (
        <AuthState children={(info) => {
            if (info === undefined || info.authType === undefined) {
                return failComp(undefined)
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

export function AdminOnly(params: { children: React.JSX.Element |React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element |React.JSX.Element[] | null }) {
    return (
        <Authed types={["ADMIN"]} success={() => params.children} fail={params.fail}/>
    )
}

export function ShopOnly(params: { children: React.JSX.Element |React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element |React.JSX.Element[] | null }) {
    return (
        <Authed types={["SHOP"]} success={() => params.children} fail={params.fail}/>
    )
}

export function CashierOnly(params: { children: React.JSX.Element |React.JSX.Element[] | null, fail?: (type: AuthType | undefined) => React.JSX.Element |React.JSX.Element[] | null }) {
    return (
        <Authed types={["CASHIER"]} success={() => params.children} fail={params.fail}/>
    )
}