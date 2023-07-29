"use client"
import {Menu, UserCheck, UserX} from "react-feather";
import {useContext} from "react";
import {firebaseAuthContext, FirebaseAuthContextType} from "@/lib/firebase/authentication";
import {signOut} from "@firebase/auth";
import {useRouter} from "next/navigation";
import Btn from "@/components/btn";
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
import {AdminOnly, AuthState} from "@/lib/e-syoku-api/AuthTypeProvider";
import {useDisclosure} from "@chakra-ui/hooks";

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
                            <Btn onClick={() => {
                                logOut(auth)
                                onClose()
                            }}>ログアウト</Btn>
                            <Btn href="/auth/register" onClick={onClose}>
                                本登録
                            </Btn>
                            <Btn href="/auth/login" onClick={onClose}>
                                ログイン
                            </Btn>
                        </VStack>

                        <AdminOnly>
                            <VStack my={1}>
                                <Text>Adminメニュー</Text>
                                <Divider/>
                            </VStack>
                            <VStack>
                                <Btn href="/cms" onClick={onClose}>
                                    CMS
                                </Btn>
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