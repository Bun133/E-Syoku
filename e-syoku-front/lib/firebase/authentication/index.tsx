"use client"

import React, {createContext, useEffect, useState} from "react";
import {
    Auth,
    browserLocalPersistence,
    browserSessionPersistence,
    getAuth,
    setPersistence,
    signInAnonymously,
    User
} from "@firebase/auth";
import {firebaseApp} from "@/lib/firebase";

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

    const auth = getAuth(firebaseApp)

    useEffect(() => {
        return auth.onAuthStateChanged(user => {
            if (user == null) {
                challengeLogin(auth)
            }

            console.log("User Instance changed to", user)
            if (user == null) setUser(undefined)
            else setUser(user)
            setPersistence(auth, browserLocalPersistence).then(() => {
                console.log("Persistence set to", browserSessionPersistence)
            }).catch(() => {
                console.log("Persistence set failed")
            })
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
async function challengeLogin(auth: Auth) {
    if (auth.currentUser == null) {
        console.log("Challenge Login")
        // wait for 1 sec
        await new Promise(resolve => setTimeout(resolve, 2000))
        // retry
        if (auth.currentUser == null) {
            await signUpAnonymously(auth)
        } else {
            console.log("Login Success")
        }
    }
}

async function signUpAnonymously(auth: Auth) {
    if (auth.currentUser == null) {
        // Anonymous SignUp

        console.log("Sign Up Anonymously")
        await signInAnonymously(auth)
    }
}

export function useFirebaseAuth() {
    const ctx = React.useContext(firebaseAuthContext)
    return {
        ...ctx,
        waitForUser: async () => {
            const auth = getAuth(firebaseApp)

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