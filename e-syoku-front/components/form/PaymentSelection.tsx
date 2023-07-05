import {PaymentSession} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {Heading, HStack, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

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
        <HStack>
            {props.payments !== undefined ? props.payments.map((session: PaymentSession) => {
                return (
                    <PaymentCard
                        key={session.sessionId}
                        session={session}
                        button={button(session)}></PaymentCard>
                )
            }) : null}
        </HStack>
    )
}

function PaymentCard(param: { session: PaymentSession, button?: ReactNode }) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/payment/id?id=" + param.session.sessionId}>
            詳しく見る
        </Btn>);


    return (
        <VStack>
            <VStack>
                <Heading>{param.session.sessionId}</Heading>
            </VStack>

            <VStack>
                {param.session.state}
                <div className={"w-2"}></div>
                {button}
            </VStack>
        </VStack>
    )
}