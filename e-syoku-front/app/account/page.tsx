"use client"
import PageTitle from "@/components/pageTitle";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {Container, Text} from "@chakra-ui/react";
import {Divider, VStack} from "@chakra-ui/layout";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {authStateEndpoint} from "@/lib/e-syoku-api/EndPoints";
import QRCode from "react-qr-code";
import Btn from "@/components/btn";

export default function Page() {
    const auth = useFirebaseAuth()
    return (
        <>
            <PageTitle title={"アカウントメニュー"}/>
            <Container>
                <VStack>
                    {auth.user !== undefined ? <QRCode value={auth.user.uid}></QRCode> : null}
                    <Text>UID:{auth.user?.uid}</Text>
                    <Text>権限情報</Text>
                    <Divider/>
                    <APIEndpoint endpoint={authStateEndpoint} query={{}} onEnd={(data, reload) => {
                        return (
                            <>
                                <Text>AuthType:{data.data.authType}</Text>
                                <Btn onClick={reload}>再読み込み</Btn>
                            </>
                        )
                    }}/>
                </VStack>
            </Container>
        </>
    )
}