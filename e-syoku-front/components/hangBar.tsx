"use client"
import {UserCheck, UserX} from "react-feather";
import {useContext} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {useRouter} from "next/navigation";
import Btn from "@/components/btn";
import {Flex, HStack} from "@chakra-ui/layout";
import {Spacer, Text} from "@chakra-ui/react";
import {AuthState} from "@/lib/e-syoku-api/AuthTypeProvider";

export function HangBar() {
    const auth = useContext(firebaseAuthContext)
    const router = useRouter()

    return (
        <Flex backgroundColor={"blue.300"} w={"full"} py={2} mb={1}>
            <HStack>
                {auth.user !== undefined ? <UserCheck onClick={() => {
                    router.push("/account")
                }}></UserCheck> : <UserX></UserX>}
                <AuthState child={(info) => {
                    if (info !== undefined && info.authType !== undefined) {
                        return (<Text>AuthType:{info.authType}</Text>)
                    } else {
                        return null
                    }
                }}/>
                <Btn onClick={() => {
                    logOut(auth)
                }}>ログアウト</Btn>
                <Btn href="/auth/register">
                    本登録
                </Btn>
                <Btn href="/auth/login">
                    ログイン
                </Btn>
            </HStack>
            <Spacer/>
            <HStack>
                <a className="text" href="https://github.com/Bun133/E-Syoku" target="_blank">Powered By E-Syoku</a>
            </HStack>
        </Flex>
    )
}

async function logOut(auth: FirebaseAuthContextType) {
    if (auth.auth) {
        await signOut(auth.auth)
        console.log("signOut")
    } else {
        console.log("auth is not exist")
    }
}