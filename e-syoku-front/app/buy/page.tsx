"use client"

import {
    Box,
    Spinner,
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
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import PageTitle from "@/components/pageTitle";
import {useEffect, useRef, useState} from "react";
import {Order, PrettyPaymentSession, PrettyTicket} from "@/lib/e-syoku-api/Types";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {
    listGoodsEndPoint,
    paymentStatusEndPoint,
    submitOrderEndPoint,
    ticketStatusEndPoint
} from "@/lib/e-syoku-api/EndPoints";
import {PaymentCard} from "@/components/Payment";
import {TicketCard} from "@/components/Ticket";
import {NOrderSelection} from "@/components/order/NOrderSelection";
import {useSavedState} from "@/lib/useSavedState";
import {AlertCircle, AlertTriangle} from "react-feather";
import Btn from "@/components/btn";

type OrderData = {
    data: Order
}

type PaymentData = {
    paymentSessionId: string
}

type TicketData = {
    boundTicketIds: string[]
}

export default function Page() {
    const [order, setOrder] = useSavedState<OrderData>("order", undefined, updateActiveStep);
    const [paymentId, setPaymentId] = useSavedState<PaymentData>("pid", undefined, updateActiveStep);
    const [ticketIds, setTicketIds] = useSavedState<TicketData>("tid", undefined, updateActiveStep);

    const steps = [
        {title: '商品選択', description: '注文する商品を選択'},
        {title: '注文情報送信', description: '注文情報を送信'},
        {title: '決済', description: '店舗でお支払い'},
        {title: '食券', description: '商品を受け取り'},
    ]

    function determineStepIndex() {
        console.log("determineStepIndex", order, paymentId, ticketIds)
        if (!order) {
            return 0
        }

        if (!paymentId) {
            return 1
        }

        if (!ticketIds) {
            return 2
        }

        return 3
    }

    function updateActiveStep() {
        const determinedIndex = determineStepIndex()
        console.log("determineStepIndex", determinedIndex)
        if (determinedIndex !== activeStep) {
            setActiveStep(determinedIndex)
        }
    }

    const {activeStep, goToNext, setActiveStep} = useSteps({
        index: 0,
        count: steps.length
    })

    useEffect(() => {
        updateActiveStep()
    }, [])

    function renderOrder() {
        return (
            <Order onSelectOrder={(order: Order) => {
                setOrder({
                    data: order
                })
                goToNext()
            }}/>
        )
    }

    function renderPostOrder() {
        function body() {
            return (
                <Center>
                    <Spinner/>
                </Center>
            )
        }

        return (
            <APIEndpoint
                endpoint={submitOrderEndPoint}
                query={{order: order?.data}}
                queryNotSatisfied={body}
                onEnd={(response) => {
                    setPaymentId({
                        paymentSessionId: response.data.paymentSessionId
                    })
                    goToNext()
                    return body()
                }}/>
        )
    }

    function renderPayment() {
        return (
            <Payment paymentId={paymentId!!.paymentSessionId} onPaid={(boundTicketId) => {
                console.log("boundTicketId", boundTicketId)
                setTicketIds({
                    boundTicketIds: boundTicketId
                })
                goToNext()
            }}/>
        )
    }

    function renderTicket() {
        return (
            <Tickets ticketIds={ticketIds!!.boundTicketIds}/>
        )
    }

    return (
        <VStack>
            <PageTitle title={"商品購入"}/>
            <Center>
                <PageStepper activeStep={activeStep} steps={steps}/>
            </Center>

            <Box w={"full"} h={"full"}>
                {activeStep === 0 && renderOrder()}
                {activeStep === 1 && renderPostOrder()}
                {activeStep === 2 && renderPayment()}
                {activeStep === 3 && renderTicket()}
            </Box>
        </VStack>
    )

}

function PageStepper(params: {
    activeStep: number,
    steps: ({
        title: string,
        description: string
    })[]
}) {
    const refs = useRef<HTMLDivElement[]>([])

    function setRef(elem: HTMLDivElement | null, index: number) {
        if (elem) {
            refs.current[index] = elem
        }
    }

    function navigateTo(index: number) {
        const ref = refs.current[index]
        if (ref) {
            ref.scrollIntoView({behavior: "smooth", block: "start"})
        }
    }

    useEffect(() => {
        navigateTo(params.activeStep)
    }, [params.activeStep])

    return (
        <Box w={"full"} overflowX={"scroll"} overflowY={"hidden"}>
            <Stepper index={params.activeStep}>
                {params.steps.map((step, index) => (
                    <Box key={index} flexShrink={0} flexGrow={1} ref={instance => {
                        setRef(instance, index)
                    }}>
                        <Step>
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

                            <Box minWidth={2} flexGrow={1}>
                                <StepSeparator/>
                            </Box>
                        </Step>
                    </Box>
                ))}
            </Stepper>
        </Box>
    )
}

function Order(params: {
    onSelectOrder: (order: Order) => void
}) {
    return (
        <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response) => {
            return (
                <NOrderSelection onOrder={params.onSelectOrder} goods={response.data.data}/>
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
                     refetch={{interval: 10}}
                     disableLoading={true}
                     onEnd={(response) => {
                         const payment: PrettyPaymentSession = response.data.payment
                         updatePaid(payment)

                         return (
                             <VStack>
                                 <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"orange.300"} bgColor={"orange.100"}>
                                     <HStack>
                                         <AlertTriangle color={"orange"} size={36}/>
                                         <Text fontSize={"3xl"}>
                                             注意
                                         </Text>
                                     </HStack>
                                     <Text>
                                         まだ注文は確定していません！
                                     </Text>
                                     <Text>
                                         店舗で代金をお支払いいただくと注文が確定します
                                     </Text>
                                 </Box>

                                 <PaymentCard payment={response.data.payment}/>
                             </VStack>
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
            <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"blue.300"} bgColor={"blue.100"}>
                <HStack>
                    <AlertCircle color={"#3182ce"} size={24}/>
                    <Text fontSize={"2xl"}>
                        注意
                    </Text>
                </HStack>
                <Text>
                    紙の食券をなくさないようご注意ください
                </Text>
                <Text>
                    当ウェブサイトで呼び出し順序の確認が出来ます。また、呼び出し通知の送信を行います
                </Text>
            </Box>

            <Box w={"30rem"}>
                {params.ticketIds
                    .filter(e => !resolved.includes(e))
                    .map(e => {
                        return (
                            <Box key={e} w={"full"}>
                                <Ticket ticketId={e} onReceived={() => {
                                    setResolved(resolved.filter(id => id !== e))
                                }}/>
                            </Box>
                        )
                    })}
            </Box>

            <Btn href="/">トップに戻る</Btn>
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