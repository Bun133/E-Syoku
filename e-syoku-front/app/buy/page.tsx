"use client"

import {
    Box,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    Stepper,
    StepSeparator,
    StepStatus,
    StepTitle,
    Text,
    useSteps
} from "@chakra-ui/react";
import {Center, VStack} from "@chakra-ui/layout";
import PageTitle from "@/components/pageTitle";
import {useRef, useState} from "react";
import {Order, PrettyPaymentSession, PrettyTicket} from "@/lib/e-syoku-api/Types";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {OrderSelection} from "@/components/form/OrderSelection";
import {
    listGoodsEndPoint,
    paymentStatusEndPoint,
    submitOrderEndPoint,
    ticketStatusEndPoint
} from "@/lib/e-syoku-api/EndPoints";
import {PaymentCard} from "@/components/Payment";
import {TicketCard} from "@/components/Ticket";

export default function Page() {
    const [order, setOrder] = useState<Order>();
    const [paymentId, setPaymentId] = useState<string>();
    const [ticketIds, setTicketIds] = useState<string[]>([])

    const steps = [
        {title: '商品選択', description: '注文する商品を選択'},
        {title: '注文情報送信', description: '注文情報を送信'},
        {title: '決済', description: '店舗でお支払い'},
        {title: '食券', description: '商品を受け取り'},
    ]

    const {activeStep, goToNext} = useSteps({
        index: 0,
        count: steps.length
    })

    function renderOrder() {
        return (
            <Order onSelectOrder={(order: Order) => {
                setOrder(order)
                goToNext()
            }}/>
        )
    }

    function renderPostOrder() {
        return (
            <APIEndpoint
                endpoint={submitOrderEndPoint}
                query={{order: order}}
                onEnd={(response) => {
                    setPaymentId(response.data.paymentSessionId)
                    goToNext()

                    return (
                        <Center>
                            <Text>自動的に遷移します</Text>
                        </Center>
                    )
                }}/>
        )
    }

    function renderPayment() {
        return (
            <Payment paymentId={paymentId!!} onPaid={(boundTicketId) => {
                console.log("boundTicketId",boundTicketId)
                setTicketIds(boundTicketId)
                goToNext()
            }}/>
        )
    }

    function renderTicket() {
        return (
            <Tickets ticketIds={ticketIds!!}/>
        )
    }

    return (
        <VStack>
            <PageTitle title={"商品購入"}/>
            <Stepper index={activeStep}>
                {steps.map((step, index) => (
                    <Step key={index}>
                        <StepIndicator>
                            <StepStatus
                                complete={<StepIcon/>}
                                incomplete={<StepNumber/>}
                                active={<StepNumber/>}
                            />
                        </StepIndicator>

                        <Box flexShrink='0'>
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                        </Box>

                        <StepSeparator/>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && renderOrder()}
            {activeStep === 1 && renderPostOrder()}
            {activeStep === 2 && renderPayment()}
            {activeStep === 3 && renderTicket()}
        </VStack>
    )

}

function Order(params: {
    onSelectOrder: (order: Order) => void
}) {
    return (
        <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response) => {
            return (
                <OrderSelection callBack={params.onSelectOrder} goods={response.data.data}/>
            )
        }}/>
    )
}

function Payment(params: {
    paymentId: string,
    onPaid: (boundTicketId: string[]) => void
}) {
    const isPaid = useRef(false)

    function updatePaid(payment: PrettyPaymentSession) {
        if (payment.state === "支払い済み") {
            if (!isPaid.current) {
                params.onPaid(payment.boundTicketId!!)
            }
            isPaid.current = true
        } else {
            isPaid.current = false
        }
    }


    return (
        <APIEndpoint endpoint={paymentStatusEndPoint}
                     query={{paymentId: params.paymentId}}
                     refetch={{interval: 30}}
                     onEnd={(response) => {
                         const payment: PrettyPaymentSession = response.data.payment
                         updatePaid(payment)

                         return (
                             <PaymentCard payment={response.data.payment}/>
                         )
                     }}/>
    )
}

function Tickets(params: {
    ticketIds: string[]
}) {
    const [resolved, setResolved] = useState<string[]>([])

    return (
        <VStack>
            {params.ticketIds
                .filter(e => !resolved.includes(e))
                .map(e => {
                    return (
                        <Box key={e}>
                            <Ticket ticketId={e} onReceived={() => {
                                setResolved(resolved.filter(id => id !== e))
                            }}/>
                        </Box>
                    )
                })}
        </VStack>
    )
}

function Ticket(params: { ticketId: string, onReceived: () => void }) {
    const isReceived = useRef(false)


    function updateReceived(ticket: PrettyTicket) {
        if (ticket.status === "完了") {
            if (!isReceived.current) {
                params.onReceived()
            }
            isReceived.current = true
        } else {
            isReceived.current = false
        }
    }


    return (
        <APIEndpoint
            endpoint={ticketStatusEndPoint}
            query={{ticketId: params.ticketId}}
            onEnd={(response) => {
                updateReceived(response.data.ticket)

                return (
                    <TicketCard ticket={response.data.ticket}/>
                )
            }}
        />
    )
}