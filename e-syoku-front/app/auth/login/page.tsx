"use client"

import PageTitle from "@/components/pageTitle";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, signInWithPopup} from "@firebase/auth";
import {Loader} from "react-feather";
import {Center, VStack} from "@chakra-ui/layout";
import {Checkbox, Spacer, Text} from "@chakra-ui/react";
import {InfoBox} from "@/components/messageBox/InfoBox";
import {useRouter} from "next/navigation";
import {useState} from "react";

export default function Page() {
    const context = useFirebaseAuth()
    const auth = context.auth
    const router = useRouter()
    const [agreed, setAgreed] = useState(false)


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
                <VStack>
                    <Btn href={"/terms"}>利用規約を読む</Btn>
                    <Checkbox onChange={e => setAgreed(e.target.checked)} checked={false}>利用規約に同意する</Checkbox>
                    <Spacer/>
                    <Btn onClick={async () => {
                        if (await loginWithGoogle(auth)) {
                            router.push("/")
                        }
                    }} disabled={!agreed}>Googleでログイン</Btn>
                </VStack>
            </Center>
        </div>
    )
}

async function loginWithGoogle(auth: Auth) {
    try {
        await signInWithPopup(auth, new GoogleAuthProvider())
        return true
    } catch (e) {
        console.error(e)
    }
    return false
}