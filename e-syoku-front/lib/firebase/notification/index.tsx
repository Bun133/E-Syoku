"use client"
import {useEffect, useState} from "react";
import {getMessaging, getToken} from "@firebase/messaging";
import {firebaseApp} from "@/lib/firebase";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {callEndpoint} from "@/lib/e-syoku-api/Axios";
import {listenNotificationEndpoint} from "@/lib/e-syoku-api/EndPoints";

export function NotificationEnsure(params: { comp: (token: string | undefined) => React.ReactNode }) {
    const [token, setToken] = useState<string>()
    const messaging = getMessaging(firebaseApp)
    const auth = useFirebaseAuth()

    async function requestPermission() {
        return await Notification.requestPermission() === "granted"
    }

    async function generateToken() {
        return await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_messagingVAPID,
        })
    }

    async function postToken(token: string) {
        const r = await callEndpoint(listenNotificationEndpoint, auth.user, {token: token})
        return r.isSuccess
    }

    async function main() {
        try {
            const token = await generateToken()
            console.log("FCM Token:", token)
            const result = await postToken(token)
            if (!result) {
                setToken(undefined)
            } else {
                setToken(token)
            }
        } catch (e) {
            console.error(e)
            setToken(undefined)
        }
    }

    useEffect(() => {
        main()
    }, [auth.user])

    return (
        <>
            {params.comp(token)}
        </>
    )
}