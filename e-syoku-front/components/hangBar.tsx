"use client"
import {Menu, UserCheck, UserX} from "react-feather";
import React, {useContext} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {useRouter} from "next/navigation";
import {Divider, Flex, HStack, VStack} from "@chakra-ui/layout";
import {
    Box,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    Text
} from "@chakra-ui/react";
import {AdminOnly, AuthState, CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";
import {useDisclosure} from "@chakra-ui/hooks";
import Link from "next/link";


function HangEntity(params: { text: string, onClick?: () => void, href?: string }) {
    if (params.href) {
        return (
            <Link href={params.href}>
                <div onClick={params.onClick}>
                    {params.text}
                </div>
            </Link>
        )
    }
    return (
        <div onClick={params.onClick}>
            {params.text}
        </div>
    )
}

export function HangBar() {
    const auth = useContext(firebaseAuthContext)
    const router = useRouter()
    const {isOpen, onOpen, onClose} = useDisclosure()

    return (
        <>
            <Flex w={"full"} shadow={1} backgroundColor={"blue.300"} mb={2}>
                <Box p={2}>
                    <Menu onClick={onOpen}/>
                </Box>
            </Flex>
            <Drawer placement={"left"} isOpen={isOpen} onClose={onClose}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerCloseButton/>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack my={1}>
                            <Text>メニュー</Text>
                            <Divider/>
                        </VStack>
                        <VStack>
                            <HangEntity text={"ホーム"} href="/" onClick={onClose}/>
                            <HangEntity text={"新規注文"} href="/order" onClick={onClose}/>
                            <HangEntity text={"食券一覧"} href="/tickets" onClick={onClose}/>
                            <HangEntity text={"決済一覧"} href="/payment" onClick={onClose}/>
                        </VStack>

                        <VStack my={1}>
                            <Text>アカウントメニュー</Text>
                            <Divider/>
                        </VStack>
                        <HStack>
                            {auth.user !== undefined ? <UserCheck onClick={() => {
                                router.push("/account")
                            }}></UserCheck> : <UserX></UserX>}
                            <AuthState children={(info) => {
                                if (info !== undefined && info.authType !== undefined) {
                                    return (<Text>AuthType:{info.authType}</Text>)
                                } else {
                                    return null
                                }
                            }}/>
                        </HStack>
                        <VStack>
                            <HangEntity text={"ログアウト"} onClick={() => {
                                logOut(auth)
                                onClose()
                            }}/>
                            <HangEntity text={"本登録"} href="/auth/register" onClick={onClose}/>
                            <HangEntity text={"ログイン"} href="/auth/login" onClick={onClose}/>
                        </VStack>

                        <ShopOnly>
                            <VStack my={1}>
                                <Text>Shopメニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <HangEntity text={"食券呼び出し"} href="/shopui/tickets/call" onClick={onClose}/>
                                <HangEntity text={"食券一覧画面"} href="/shopui/tickets/display" onClick={onClose}/>
                            </VStack>
                        </ShopOnly>

                        <CashierOnly>
                            <VStack my={1}>
                                <Text>Cashierメニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <HangEntity text={"決済取扱い"} href="/shopui/payment/scan" onClick={onClose}/>
                            </VStack>
                        </CashierOnly>

                        <AdminOnly>
                            <VStack my={1}>
                                <Text>Adminメニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <HangEntity text={"CMS"} href="/cms" onClick={onClose}/>
                            </VStack>
                        </AdminOnly>
                    </DrawerBody>
                    <DrawerFooter>
                        <a className="text" href="https://github.com/Bun133/E-Syoku" target="_blank">Powered By
                            E-Syoku</a>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
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