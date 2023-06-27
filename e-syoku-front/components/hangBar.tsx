"use client"
import {UserCheck, UserX} from "react-feather";
import {useContext} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {useRouter} from "next/navigation";
import Button from "@/components/button";

export function HangBar() {
    const auth = useContext(firebaseAuthContext)
    const router = useRouter()

    return (
        <div className="flex flex-row justify-between items-center h-16 w-full bg-blue-300">
            <div className="pl-2 flex flex-row justify-between items-center space-x-2">
                {/* TODO アイコン差し替え */}
                {auth.user !== undefined ? <UserCheck onClick={() => {
                    logAuthData(auth)
                }}></UserCheck> : <UserX></UserX>}
                <Button onClick={() => {logOut(auth)}}>ログアウト</Button>
                <Button onClick={() => {router.push("/auth/register")}}>本登録</Button>
            </div>
            <div className="pr-3 flex flex-row justify-between items-center space-x-2">
                <a className="text" href="https://github.com/Bun133/E-Syoku" target="_blank">Powered By E-Syoku</a>
            </div>
        </div>
    );
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