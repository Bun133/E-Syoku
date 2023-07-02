"use client"

import React, {createContext, useEffect, useState} from "react";
import {
    Auth, browserLocalPersistence,
    browserSessionPersistence,
    getAuth,
    Persistence,
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
            console.log("User Instance changed to", user)
            if (user == null) setUser(undefined)
            else setUser(user)
            setPersistence(auth, browserLocalPersistence).then(() => {
                console.log("Persistence set to",browserSessionPersistence)
            }).catch(() => {
                console.log("Persistence set failed")
            })
        })
    }, [auth])

    // defaultProcess(auth)

    return (
        <firebaseAuthContext.Provider
            value={{user: user, isAuthenticated: !!user, auth: auth}}>{params.children}</firebaseAuthContext.Provider>
    )
}

async function defaultProcess(auth: Auth) {
    if (auth.currentUser == null) {
        // Anonymous SignUp

        console.log("Sign Up Anonymously")
        await signInAnonymously(auth)
    }
}

export function useFirebaseAuth() {
    return React.useContext(firebaseAuthContext)
}