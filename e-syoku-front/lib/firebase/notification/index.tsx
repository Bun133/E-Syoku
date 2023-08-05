"use client"
import {createContext, useContext, useEffect, useRef, useState} from "react";
import {getMessaging, getToken, isSupported, Messaging, onMessage} from "@firebase/messaging";
import {firebaseApp} from "@/lib/firebase";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {callEndpoint} from "@/lib/e-syoku-api/Axios";
import {listenNotificationEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useToast} from "@chakra-ui/toast";

export const cloudMessagingContext = createContext<Messaging | undefined>(undefined)

export const CloudMessagingProvider = (params: { children: React.ReactNode }) => {
    const [messaging, setMessaging] = useState<Messaging | undefined>()
    const main = async () => {
        if (await isSupported()) {
            setMessaging(getMessaging(firebaseApp))
        } else {
            console.log("Messaging not supported")
        }
    }
    useEffect(() => {
        main()
    }, [])

    return <cloudMessagingContext.Provider value={messaging}>{params.children}</cloudMessagingContext.Provider>
}

export function useCloudMessaging() {
    return useContext(cloudMessagingContext)
}

export function NotificationEnsure(params: {
    comp: (token: string | undefined, popup: () => void) => React.ReactNode
}) {
    const [token, setToken] = useState<string>()
    const messaging = useCloudMessaging()
    const auth = useFirebaseAuth()
    const toast = useToast()
    const listenerRegistered = useRef(false)

    async function requestPermission() {
        if(Notification.permission !== "granted"){
            await Notification.requestPermission()

            // auto re-run main
            await main()
        }
    }

    async function generateToken() {
        if (messaging === undefined) {
            return
        }
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
            if (token) {
                console.log("FCM Token:", token)
                const result = await postToken(token)
                if (!result) {
                    setToken(undefined)
                } else {
                    setToken(token)
                }
            } else {
                // no messaging service available
                setToken(undefined)
            }
        } catch (e) {
            console.error(e)
            setToken(undefined)
        }
    }

    useEffect(() => {
        main()
    }, [auth.user])

    useEffect(() => {
        if (messaging && !listenerRegistered.current) {
            onMessage(messaging, (value) => {
                console.log("message", value)
                toast({
                    title: value.notification?.title ?? "通知",
                    description: value.notification?.body ?? "",
                    status: "info",
                    isClosable: true,
                    duration: null
                })
            })

            listenerRegistered.current = true
        }
    }, [messaging])

    return (
        <>
            {params.comp(token,()=>{
                requestPermission()
            })}
        </>
    )
}