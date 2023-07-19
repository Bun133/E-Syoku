import {PaymentSession} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {Divider, Heading, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Container, Spacer} from "@chakra-ui/react";

export function PaymentSelection(props: {
    payments: PaymentSession[] | undefined,
    onSelect: (ticket: PaymentSession) => void,
    // for customizing select button
    button?: (ticket: PaymentSession) => ReactNode
}) {
    const button = props.button !== undefined ?
        ((session: PaymentSession) => (<div onClick={() => props.onSelect(session)}>{props.button!!(session)}</div>))
        : ((session: PaymentSession) => undefined)

    return (
        <Container>
            <Heading>未決済</Heading>
            <Divider/>
            <VStack>
                {props.payments !== undefined ? props.payments.filter((session) => session.state === "UNPAID").map((session: PaymentSession) => {
                    return (
                        <PaymentCard
                            key={session.sessionId}
                            session={session}
                            button={button(session)}></PaymentCard>
                    )
                }) : null}
            </VStack>

            <Spacer/>

            <Heading>決済済</Heading>
            <Divider/>
            <VStack>
                {props.payments !== undefined ? props.payments.filter((session) => session.state === "PAID").map((session: PaymentSession) => {
                    return (
                        <PaymentCard
                            key={session.sessionId}
                            session={session}
                            button={button(session)}></PaymentCard>
                    )
                }) : null}
            </VStack>
        </Container>
    )
}

function PaymentCard(param: { session: PaymentSession, button?: ReactNode }) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/payment/id?id=" + param.session.sessionId}>
            詳しく見る
        </Btn>);


    return (
        <Card>
            <CardHeader>{param.session.sessionId}</CardHeader>

            <CardBody>
                <VStack>
                    {param.session.state}
                    <div className={"w-2"}></div>
                    {button}
                </VStack>
            </CardBody>
        </Card>
    )
}