"use client"

import React, {createContext, useEffect, useState} from "react";
import {Auth, getAuth, User} from "@firebase/auth";
import {firebaseApp} from "@/lib/firebase";

export type FirebaseAuthContextType = {
    user: User | undefined,
    isAuthenticated: boolean,
    auth: Auth | undefined
}

const firebaseAuthContext = createContext<FirebaseAuthContextType>({
    user: undefined,
    isAuthenticated: false,
    auth: undefined
});


export const FirebaseAuthProvider = (params: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | undefined>()

    const auth = getAuth(firebaseApp)

    useEffect(() => {
        return auth.onAuthStateChanged(user => {
            if (user == null) setUser(undefined)
            else setUser(user)
        })
    }, [auth])

    return (
        <firebaseAuthContext.Provider
            value={{user: user, isAuthenticated: !!user, auth: auth}}>{params.children}</firebaseAuthContext.Provider>
    )
}