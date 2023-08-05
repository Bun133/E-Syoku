"use client"
import {HangBar} from "@/components/hangBar";
import React from "react";
import {FirebaseAuthProvider} from "@/lib/firebase/authentication";
import {ChakraProvider, extendBaseTheme} from '@chakra-ui/react'
import {AuthTypeProvider} from "@/lib/e-syoku-api/AuthTypeProvider";
import {CloudMessagingProvider} from "@/lib/firebase/notification";


export const metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
}

const theme = extendBaseTheme({})

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.json" />
        </head>
        <body>
        <ChakraProvider>
            <FirebaseAuthProvider>
                <CloudMessagingProvider>
                    <AuthTypeProvider>
                        <HangBar></HangBar>
                        {children}
                    </AuthTypeProvider>
                </CloudMessagingProvider>
            </FirebaseAuthProvider>
        </ChakraProvider>
        </body>
        </html>
    )
}
