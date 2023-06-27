"use client"

import PageTitle from "@/components/pageTitle";
import Button from "@/components/button";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, linkWithPopup} from "@firebase/auth";
import {Loader} from "react-feather";

export default function () {
    const context = useFirebaseAuth()
    const auth = context.auth
    if (!auth) {
        return (
            <div>
                <PageTitle title={"本登録画面"}></PageTitle>
                <div className={"flex-col items-center justify-center"}>
                    <Loader></Loader>
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageTitle title={"本登録画面"}></PageTitle>
            <div className={"flex-col items-center justify-center w-max h-max"}>
                <Button onClick={async () => {
                    const r = await loginWithGoogle(auth)
                    console.log("Merge result", r)
                }}>Googleでログイン</Button>
            </div>
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