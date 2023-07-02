"use client"

import PageTitle from "@/components/pageTitle";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, linkWithPopup} from "@firebase/auth";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";

export default function () {
    const context = useFirebaseAuth()
    const auth = context.auth
    if (!auth) {
        return (
            <div>
                <PageTitle title={"本登録画面"}></PageTitle>
                <Center>
                    <Loader></Loader>
                </Center>
            </div>
        )
    }

    return (
        <div>
            <PageTitle title={"本登録画面"}></PageTitle>
            <Center>
                <Btn onClick={async () => {
                    const r = await loginWithGoogle(auth)
                    console.log("Merge result", r)
                }}>Googleでログイン</Btn>
            </Center>
        </div>
    )
}

async function loginWithGoogle(auth: Auth) {
    const user = auth.currentUser
    if (!user) return false
    const cred = await linkWithPopup(user, new GoogleAuthProvider()).catch(e => {
        console.error(e)
        return undefined
    })

    return cred != undefined;
}