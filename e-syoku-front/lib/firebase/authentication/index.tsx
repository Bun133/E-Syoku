"use client"

import React, {createContext, useEffect, useState} from "react";
import {Auth, browserLocalPersistence, browserSessionPersistence, getAuth, setPersistence, User} from "@firebase/auth";
import {firebaseApp} from "@/lib/firebase";
import {usePathname, useRouter} from "next/navigation";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context";

export type FirebaseAuthContextType = {
    user: User | undefined,
    isAuthenticated: boolean,
    auth: Auth | undefined
}

export const firebaseAuthContext = createContext<FirebaseAuthContextType>({
    user: undefined,
    isAuthenticated: false,
    auth: undefined
});


export const FirebaseAuthProvider = (params: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | undefined>()
    const router = useRouter()
    const currentPath = usePathname()

    const auth = getAuth(firebaseApp)

    useEffect(() => {
        return auth.onAuthStateChanged(user => {
            console.log("User Instance changed to", user)
            if (user == null) {
                setUser(undefined)
                challengeAndLoginPush(auth, router, currentPath)
            } else {
                setUser(user)
                setPersistence(auth, browserLocalPersistence).then(() => {
                    console.log("Persistence set to", browserSessionPersistence)
                }).catch(() => {
                    console.log("Persistence set failed")
                })
            }
        })
    }, [auth])

    return (
        <firebaseAuthContext.Provider
            value={{user: user, isAuthenticated: !!user, auth: auth}}>{params.children}</firebaseAuthContext.Provider>
    )
}

/**
 * 裏で別のタブでサイトを開くと、一度Authenticationが初期化されるので、我慢して待つ
 * @param auth
 */
async function challengeLogin(auth: Auth): Promise<User | undefined> {
    if (!auth.currentUser) {
        console.log("Challenge Login")
        // wait for 2 sec
        // TODO onAuthStateChangedで状態を監視し続ける
        await new Promise(resolve => setTimeout(resolve, 2000))
        // retry
        if (auth.currentUser == null) {
            return undefined
        } else {
            return auth.currentUser
        }
    }
    return auth.currentUser
}

export async function challengeAndLoginPush(auth: Auth, router: AppRouterInstance, currentPath: string) {
    const tried = await challengeLogin(auth)
    if (tried == undefined) {
        // not logged in
        pushRouterToLoginPage(router, currentPath)
    }
}

export function useFirebaseAuth() {
    const ctx = React.useContext(firebaseAuthContext)
    const router = useRouter()
    const currentPath = usePathname()

    return {
        ...ctx,
        waitForUser: async () => {
            console.log("wait for user")
            const auth = getAuth(firebaseApp)

            if (auth.currentUser) {
                return auth.currentUser
            }

            const tried = await challengeLogin(auth)
            if (tried != undefined) {
                return tried
            }

            // ログインを促す
            pushRouterToLoginPage(router, currentPath)

            // TODO ログイン前のリクエストが無限に残り、ログイン後に一斉に送信されるのでは
            return new Promise<User>(resolve => {
                if (auth.currentUser != null) {
                    resolve(auth.currentUser)
                }

                auth.onAuthStateChanged(user => {
                    if (user != null) resolve(user)
                })
            },)
        }
    }
}

function pushRouterToLoginPage(router: AppRouterInstance, currentPath: string) {

    // check if current path is login page or pwa page, then ignore
    if (currentPath.includes("login") || currentPath.includes("pwa")) {
        return
    }

    router.push("/auth/login/")
}