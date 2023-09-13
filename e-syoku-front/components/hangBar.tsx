"use client"
import {Menu} from "react-feather";
import React, {useContext, useEffect} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {Center, Divider, Flex, VStack} from "@chakra-ui/layout";
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
import {AdminOnly, Authed, CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";
import {useDisclosure} from "@chakra-ui/hooks";
import Link from "next/link";
import {NotificationEnsure} from "@/lib/firebase/notification";
import {usePathname, useRouter} from "next/navigation";


function HangEntity(params: {
    text: string,
    onClick?: () => void,
    href?: string
}) {
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
    const {isOpen, onOpen, onClose} = useDisclosure()
    const router = useRouter()

    return (
        <>
            <Flex w={"full"} shadow={1} backgroundColor={"blue.300"} mb={2} direction={"column"}>
                <Box p={2}>
                    <Menu onClick={onOpen}/>
                </Box>
                <NotificationEnsure comp={(token, popup) => {
                    if (!token) {
                        return (<NotificationErrorComp popup={popup}/>)
                    }
                    return null
                }}/>
            </Flex>
            <Drawer placement={"left"} isOpen={isOpen} onClose={onClose}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerCloseButton/>
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack mb={"1rem"}>
                            <VStack my={1} w={"full"}>
                                <Text>メニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <HangEntity text={"ホーム"} href="/" onClick={onClose}/>
                                <Authed types={["ANONYMOUS", "ADMIN"]} success={() => {
                                    return (
                                        <BuyingEntries onClose={onClose}/>
                                    )
                                }} fail={() => {
                                    return (
                                        <BuyingEntries onClose={onClose}/>
                                    )
                                }}/>
                            </VStack>
                        </VStack>


                        <VStack mb={"1rem"}>
                            <VStack my={1} w={"full"}>
                                <Text>アカウントメニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <HangEntity text={"アカウント詳細"} href="/account" onClick={onClose}/>
                                <HangEntity text={"ログアウト"} onClick={() => {
                                    logOut(auth)
                                    onClose()
                                }}/>
                                <HangEntity text={"ログイン"} href="/auth/login" onClick={onClose}/>
                            </VStack>
                        </VStack>

                        <ShopOnly>
                            <VStack mb={"1rem"}>
                                <VStack my={1} w={"full"}>
                                    <Text>Shopメニュー</Text>
                                    <Divider/>
                                </VStack>
                                <VStack>
                                    <HangEntity text={"食券呼び出し"} href="/shopui/tickets/call"
                                                onClick={onClose}/>
                                    <HangEntity text={"食券一覧画面"} href="/shopui/tickets/display"
                                                onClick={onClose}/>
                                </VStack>
                            </VStack>
                        </ShopOnly>

                        <CashierOnly>
                            <VStack mb={"1rem"}>
                                <VStack my={1} w={"full"}>
                                    <Text>Cashierメニュー</Text>
                                    <Divider/>
                                </VStack>
                                <VStack>
                                    <HangEntity text={"決済取扱い"} href="/shopui/payment/scan" onClick={onClose}/>
                                </VStack>
                            </VStack>
                        </CashierOnly>

                        <AdminOnly>
                            <VStack mb={"1rem"}>
                                <VStack my={1} w={"full"}>
                                    <Text>Adminメニュー</Text>
                                    <Divider/>
                                </VStack>
                                <VStack>
                                    <HangEntity text={"CMS"} href="/cms" onClick={onClose}/>
                                    <HangEntity text={"権限付与"} href="/account/grant" onClick={onClose}/>
                                </VStack>
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

function NotificationErrorComp(params: {
    popup: () => void
}) {
    return (
        <Box backgroundColor={"red"} onClick={params.popup} p={1} cursor={"pointer"}>
            <Center>
                <Text>通知設定に失敗しました</Text>
            </Center>
        </Box>
    )
}

function BuyingEntries(params: {
    onClose: () => void
}) {
    return (
        <>
            <HangEntity text={"新規注文"} href="/buy" onClick={params.onClose}/>
            <HangEntity text={"食券一覧"} href="/tickets" onClick={params.onClose}/>
            <HangEntity text={"決済一覧"} href="/payment" onClick={params.onClose}/>
        </>
    )
}