"use client"
import {UserCheck, UserX} from "react-feather";
import {useContext} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {useRouter} from "next/navigation";
import Btn from "@/components/btn";
import {Flex, HStack} from "@chakra-ui/layout";
import {Spacer} from "@chakra-ui/react";

export function HangBar() {
    const auth = useContext(firebaseAuthContext)
    const router = useRouter()

    return (
        <Flex backgroundColor={"blue.300"} w={"full"} py={2} mb={1}>
            <HStack>
                {auth.user !== undefined ? <UserCheck onClick={() => {
                    logAuthData(auth)
                }}></UserCheck> : <UserX></UserX>}
                <Btn onClick={() => {
                    logOut(auth)
                }}>ログアウト</Btn>
                <Btn onClick={() => {
                    router.push("/auth/register")
                }}>本登録</Btn>
            </HStack>
            <Spacer/>
            <HStack>
                <a className="text" href="https://github.com/Bun133/E-Syoku" target="_blank">Powered By E-Syoku</a>
            </HStack>
        </Flex>
    )
}

function logAuthData(auth: FirebaseAuthContextType) {
    console.log("Auth", auth.auth)
    console.log("isAuthenticated", auth.isAuthenticated)
    console.log("user", auth.user)
}

async function logOut(auth: FirebaseAuthContextType) {
    if (auth.auth) {
        await signOut(auth.auth)
        console.log("signOut")
    } else {
        console.log("auth is not exist")
    }
}