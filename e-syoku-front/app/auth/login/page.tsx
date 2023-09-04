"use client"

import PageTitle from "@/components/pageTitle";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, signInWithPopup} from "@firebase/auth";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";
import {Text} from "@chakra-ui/react";
import {InfoBox} from "@/components/messageBox/InfoBox";
import {useRouter} from "next/navigation";

export default function Page() {
    const context = useFirebaseAuth()
    const auth = context.auth
    const router = useRouter()


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
            <InfoBox>
                <Text>
                    サービスのご利用にはログインが必要です。
                </Text>
                <Text>
                    ログインが完了すると、自動的に遷移します。
                </Text>
            </InfoBox>
            <Center p={2}>
                <Btn onClick={async () => {
                    await loginWithGoogle(auth)
                    router.push("/")
                }}>Googleでログイン</Btn>
            </Center>
        </div>
    )
}

async function loginWithGoogle(auth: Auth) {
    return await signInWithPopup(auth, new GoogleAuthProvider())
}