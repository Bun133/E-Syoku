"use client"

import PageTitle from "@/components/pageTitle";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, signInWithPopup} from "@firebase/auth";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";

export default function Page() {
    const context = useFirebaseAuth()
    const auth = context.auth
    if (!auth) {
        return (
            <div>
                <PageTitle title={"ログイン"}></PageTitle>
                <Center>
                    <Loader></Loader>
                </Center>
            </div>
        )
    }

    return (
        <div>
            <PageTitle title={"ログイン"}></PageTitle>
            <Center>
                <Btn onClick={async () => {
                    const r = await loginWithGoogle(auth)
                    console.log("Login result", r)
                }}>Googleでログイン</Btn>
            </Center>
        </div>
    )
}

async function loginWithGoogle(auth: Auth) {
    return await signInWithPopup(auth, new GoogleAuthProvider())
}