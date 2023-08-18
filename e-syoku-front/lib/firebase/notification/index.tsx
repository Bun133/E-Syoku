"use client"
import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {getMessaging, getToken, isSupported, MessagePayload, Messaging, onMessage} from "@firebase/messaging";
import {firebaseApp} from "@/lib/firebase";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {callEndpoint} from "@/lib/e-syoku-api/Axios";
import {listenNotificationEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useToast} from "@chakra-ui/toast";
import {RenderProps} from "@chakra-ui/toast/dist/toast.types";
import {Box, CloseButton, Flex, Spacer, Text} from "@chakra-ui/react";
import Btn from "@/components/btn";
import {Info} from "react-feather";

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
        if (Notification.permission !== "granted") {
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
        const r = await callEndpoint(listenNotificationEndpoint, await auth.waitForUser(), {token: token})
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
                    duration: null,
                    render: (toast) => notificationToast(toast, value)
                })
            })

            listenerRegistered.current = true
        }
    }, [messaging])

    return (
        <>
            {params.comp(token, () => {
                requestPermission()
            })}
        </>
    )
}

function notificationToast(props: RenderProps, value: MessagePayload): React.ReactNode {
    const title = value.data?.title ?? "通知"
    const description = value.data?.body ?? ""
    const url = value.data?.pathname ?? "/"

    return (
        <Box backgroundColor={"blue.500"} p={2} rounded={2}>
            <Flex w={"full"}>
                <Info color={"white"}/>
                <Box w={2}/>
                <Text color={"white"}>通知</Text>
                <Spacer/>
                <CloseButton color={"white"} onClick={props.onClose}/>
            </Flex>
            <Text color={"white"} fontSize={"3xl"}>{title}</Text>
            <Text color={"white"}>{description}</Text>
            <Flex w={"full"}>
                <Spacer/>
                <Btn href={url} onClick={props.onClose}>開く</Btn>
            </Flex>
        </Box>
    )
}