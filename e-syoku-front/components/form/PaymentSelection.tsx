import {PrettyPaymentSession} from "@/lib/e-syoku-api/Types";
import {Divider, Heading, HStack, VStack} from "@chakra-ui/layout";
import {Card, CardBody, CardFooter} from "@chakra-ui/card";
import {Box, Container, Spacer, Text, UnorderedList} from "@chakra-ui/react";
import Btn from "@/components/btn";
import {orderDataTransform, utcSecToString} from "@/lib/e-syoku-api/Transformers";

export function PaymentSelection(props: {
    payments: PrettyPaymentSession[] | undefined
}) {
    return (
        <Container>
            <Heading>未支払い</Heading>
            <Divider/>
            <VStack>
                {props.payments !== undefined ? props.payments.filter((session) => session.state === "未支払い").map((session: PrettyPaymentSession) => {
                    return (
                        <PaymentCard
                            key={session.sessionId}
                            session={session}/>
                    )
                }) : null}
            </VStack>

            <Spacer/>

            <Heading>支払い済み</Heading>
            <Divider/>
            <VStack>
                {props.payments !== undefined ? props.payments.filter((session) => session.state === "支払い済み").map((session: PrettyPaymentSession) => {
                    return (
                        <PaymentCard
                            key={session.sessionId}
                            session={session}/>
                    )
                }) : null}
            </VStack>
        </Container>
    )
}

function PaymentCard(param: { session: PrettyPaymentSession }) {
    return (
        <Card>
            <CardBody>
                <VStack alignItems={"flex-start"}>
                    <VStack alignItems={"flex-start"}>
                        <Text>注文内容：</Text>
                        <HStack w={"full"}>
                            <Box w={"1rem"}/>
                            <UnorderedList>
                                {orderDataTransform(param.session.orderContent)}
                            </UnorderedList>
                        </HStack>
                    </VStack>
                    <Spacer/>
                    <Text>時刻：{utcSecToString(param.session.paymentCreatedTime.utcSeconds)}</Text>
                </VStack>
            </CardBody>
            <CardFooter>
                <HStack w={"full"}>
                    <Spacer/>
                    <Btn href={"/payment/id?id=" + param.session.sessionId}>
                        詳しく見る
                    </Btn>
                </HStack>
            </CardFooter>
        </Card>
    )
}