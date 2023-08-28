"use client"

import PageTitle from "@/components/pageTitle";
import Btn from "@/components/btn";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Auth, GoogleAuthProvider, signInWithPopup} from "@firebase/auth";
import {AlertTriangle, Loader} from "react-feather";
import {Center, HStack} from "@chakra-ui/layout";
import {Box, Text} from "@chakra-ui/react";

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
            <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"orange.300"} bgColor={"orange.100"}>
                <HStack>
                    <AlertTriangle color={"orange"} size={36}/>
                    <Text fontSize={"3xl"}>
                        注意
                    </Text>
                </HStack>
                <Text>
                    ログインすると、今までの注文履歴・購入履歴が消えます！
                </Text>
                <Text>
                    注文履歴・購入履歴が消えても自己責任となります。
                </Text>
            </Box>
            <Center p={2}>
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