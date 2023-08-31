"use client"

import {
    Box,
    Container,
    Spacer,
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
    useSteps,
    Wrap
} from "@chakra-ui/react";
import {AspectRatio, Center, Divider, HStack, VStack} from "@chakra-ui/layout";
import PageTitle from "@/components/pageTitle";
import {useEffect, useRef, useState} from "react";
import {GoodsWithRemainDataWaitingData, Order, PrettyPaymentSession, PrettyTicket} from "@/lib/e-syoku-api/Types";
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
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {StorageImage} from "@/lib/firebase/storage";

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
    const [orderConfirmed, setOrderConfirmed] = useSavedState<{
        flag: boolean
    }>("orderConfirm", undefined, updateActiveStep);
    const [paymentId, setPaymentId] = useSavedState<PaymentData>("pid", undefined, updateActiveStep);
    const [ticketIds, setTicketIds] = useSavedState<TicketData>("tid", undefined, updateActiveStep);

    const steps = [
        {title: '商品選択', description: '注文する商品を選択'},
        {title: '注文確認', description: '注文内容を確認'},
        {title: '注文情報送信', description: '注文情報を送信'},
        {title: '決済', description: '店舗でお支払い'},
        {title: '食券', description: '商品を受け取り'},
    ]

    function determineStepIndex() {
        console.log("determineStepIndex", order, paymentId, ticketIds)
        if (!order) {
            return 0
        }

        if (!orderConfirmed) {
            return 1
        }

        if (!paymentId) {
            return 2
        }

        if (!ticketIds) {
            return 3
        }

        return 4
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

    function renderOrderConfirm() {
        if (!order) {
            // TODO なんでここだけエラーになるのか
            return null
        }
        return (
            <OrderConfirm order={order.data}
                          onConfirm={() => {
                              setOrderConfirmed({flag: true})
                              goToNext()
                          }}
            />
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
                {activeStep === 1 && renderOrderConfirm()}
                {activeStep === 2 && renderPostOrder()}
                {activeStep === 3 && renderPayment()}
                {activeStep === 4 && renderTicket()}
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

function OrderConfirm(params: {
    order: Order,
    onConfirm: () => void
}) {
    return (
        <VStack w={"full"} px={"5%"}>
            <Text fontSize={"3xl"}>注文確認</Text>
            <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"orange.300"}
                 bgColor={"orange.100"}>
                <HStack>
                    <AlertTriangle color={"orange"} size={36}/>
                    <Text fontSize={"3xl"}>
                        注意
                    </Text>
                </HStack>

                <NumberLeading num={1}>
                    <Text>
                        店舗にて代金をお支払いいただくまでは商品は確保されません
                    </Text>
                </NumberLeading>

                <NumberLeading num={2}>
                    <Text>
                        代金をお支払いいただいた時点で在庫が切れ、商品をご用意出来ない場合があります
                    </Text>
                </NumberLeading>
            </Box>

            <VStack w={"full"}>
                <HStack w={"full"}>
                    <Text fontSize={"3xl"}>注文内容</Text>
                    <Spacer/>
                </HStack>

                <OrderSummary order={params.order}/>
            </VStack>

            <Btn onClick={params.onConfirm}>注文確定</Btn>
        </VStack>
    )
}

function OrderSummary(params: {
    order: Order
}) {
    function totalCost(data: GoodsWithRemainDataWaitingData[]) {
        let totalCost = 0
        for (const order of params.order) {
            const goodsData = data.find(d => d.goods.goodsId === order.goodsId)
            if (!goodsData) {
                return undefined
            }
            totalCost += goodsData.goods.price * order.count
        }
        return totalCost
    }


    return (
        <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response) => {
            const data: GoodsWithRemainDataWaitingData[] = response.data.data
            const total = totalCost(data)


            return (
                <Container>
                    {params.order.map(e => {
                        const goodsData = data.find(d => d.goods.goodsId === e.goodsId)
                        if (!goodsData) {
                            return (
                                <HStack key={e.goodsId} w={"full"}>
                                    <Text>
                                        読み込みに失敗しました
                                    </Text>
                                    <Text>
                                        ×{e.count}個
                                    </Text>
                                </HStack>
                            )
                        }
                        return (
                            <Card>
                                {goodsData.goods.imageRefPath && (
                                    <CardHeader>
                                        <AspectRatio ratio={1}>
                                            <StorageImage storagePath={goodsData.goods.imageRefPath}/>
                                        </AspectRatio>
                                    </CardHeader>
                                )}
                                <CardBody>
                                    <Text fontSize={"3xl"}>{goodsData.goods.name}</Text>
                                    <Text fontSize={"2xl"}>
                                        {goodsData.goods.price}円×{e.count}個
                                    </Text>
                                    <Divider/>
                                    <HStack>
                                        <Text fontSize={"3xl"}>
                                            小計
                                        </Text>
                                        <Spacer/>
                                        <Text fontSize={"3xl"}>
                                            {goodsData.goods.price * e.count}円
                                        </Text>
                                    </HStack>
                                </CardBody>
                            </Card>
                        )
                    })}


                    {total && (
                        <HStack w={"full"} py={5}>
                            <Text fontSize={"3xl"}>合計</Text>
                            <Spacer/>
                            <Text fontSize={"3xl"}>{total}円</Text>
                        </HStack>
                    )}
                </Container>
            )
        }}/>
    )
}

function NumberLeading(params: {
    num: number,
    children: React.ReactNode
}) {
    return (
        <HStack py={2}>
            <Box bgColor={"red.500"} p={2} rounded={"full"}>
                <Text color={"white"}>{params.num}</Text>
            </Box>
            <Wrap>
                {params.children}
            </Wrap>
        </HStack>
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
                                 <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"orange.300"}
                                      bgColor={"orange.100"}>
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