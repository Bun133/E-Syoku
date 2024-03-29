import {PrettyGoods, PrettyTicket, ShopDetail, Ticket} from "@/lib/e-syoku-api/Types";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import {useEffect, useRef, useState} from "react";
import {Box, Spinner, Text} from "@chakra-ui/react";
import {TicketCard, ticketColor} from "@/components/Ticket";
import {useDisclosure} from "@chakra-ui/hooks";
import {Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay} from "@chakra-ui/modal";
import {pretty} from "@/lib/e-syoku-api/Transformers";
import {useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint, listShopsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export type DisplaySelection = {
    processing: boolean,
    called: boolean,
    informed: boolean,
}

const defaultDisplaySelection: DisplaySelection = {
    processing: true,
    called: true,
    informed: false,
}

export function TicketDisplay(params: {
    tickets: Ticket[],
    displaySelection?: DisplaySelection,
    disableAutoScroll?: boolean
}) {
    const {fetch: fetchGoods, response: goodsData} = useLazyEndpoint(listGoodsEndPoint)
    const {fetch: fetchShops, response: shopData} = useLazyEndpoint(listShopsEndPoint)

    useEffect(() => {
        fetchGoods({})
        fetchShops({})
    }, []);

    if (!goodsData || !shopData) {
        return (
            <Center>
                <Spinner/>
            </Center>
        )
    }

    if (!goodsData.isSuccess) {
        return (
            <APIErrorModal error={goodsData}/>
        )
    }


    if (!shopData.isSuccess) {
        return (
            <APIErrorModal error={shopData}/>
        )
    }


    return (
        <TicketDisplayAbstract tickets={params.tickets}
                               goodsData={goodsData.data!.data.map(e => e.goods)}
                               shopData={shopData.data!.shops}
                               displaySelection={params.displaySelection}
                               disableAutoScroll={params.disableAutoScroll}/>
    )
}

export function TicketDisplayAbstract(params: {
    tickets: Ticket[],
    goodsData: PrettyGoods[],
    shopData: ShopDetail[],
    displaySelection?: DisplaySelection,
    disableAutoScroll?: boolean
}) {
    const selection = params.displaySelection ?? defaultDisplaySelection
    const pTickets: PrettyTicket[] = (params.tickets.map((e) => pretty(e, params.goodsData, params.shopData)).filter(e => e != undefined)) as PrettyTicket[]
    const sorted = pTickets.sort((a, b) => a.issueTime.utcSeconds - b.issueTime.utcSeconds)
    const processing = sorted.filter(e => e.status === "調理中")
    const called = sorted.filter(e => e.status === "受け取り待ち")
    const informed = sorted.filter(e => e.status === "お知らせ")

    return (
        <VStack w={"full"} h={"full"} flexShrink={1}>
            {selection.processing &&
                <TicketDisplayRow title={"調理中"} displays={processing} ticketColor={ticketColor("調理中")}
                                  disableAutoScroll={params.disableAutoScroll}/>}
            {selection.called &&
                <TicketDisplayRow title={"受け渡し可能"} displays={called} ticketColor={ticketColor("受け取り待ち")}
                                  disableAutoScroll={params.disableAutoScroll}/>}
            {selection.informed &&
                <TicketDisplayRow title={"お呼び出し"} displays={informed} ticketColor={ticketColor("お知らせ")}
                                  disableAutoScroll={params.disableAutoScroll}/>}
        </VStack>
    )
}

function TicketDisplayRow(props: {
    title: string,
    displays: PrettyTicket[],
    ticketColor: string,
    disableAutoScroll?: boolean
}) {
    const duration = 2000
    const currentIndex = useRef(0)
    const listElement = useRef<HTMLDivElement>(null)
    const [isLookUpOpen, setLookUpOpen] = useState(false)
    const lookUpTicketData = useRef<PrettyTicket>()

    function moveToElement(elementIndex: number) {
        if (listElement.current == null) return
        const element = listElement.current.children[elementIndex]
        if (element == null) return
        element.scrollIntoView({
            behavior: "smooth",
        })
    }

    function move() {
        if (listElement.current != null) {
            const len = listElement.current.children.length
            let toBeIndex = currentIndex.current + 1
            if (toBeIndex >= len) {
                toBeIndex = 0
            }

            moveToElement(toBeIndex)
            currentIndex.current = toBeIndex
        }
        setTimeout(move, duration)
    }

    useEffect(() => {
        if (!props.disableAutoScroll) {
            move()
        }
    }, [])

    return (
        <VStack align={"flex-start"} w={"full"}>
            <Heading>{props.title}</Heading>
            <Box h={"1rem"}/>
            <HStack spacing={"2rem"} overflowX={"scroll"} w={"full"} px={2} ref={listElement}>
                {props.displays.map((display) => {
                    return (
                        <TicketDisplayEntry ticketColor={props.ticketColor} ticketNum={display.ticketNum}
                                            key={display.uniqueId}
                                            ticketId={display.uniqueId}
                                            onClick={() => {
                                                setLookUpOpen(true)
                                                lookUpTicketData.current = display
                                            }}/>
                    )
                })}
            </HStack>
            <TicketLookUpModal isOpen={isLookUpOpen} ticketData={lookUpTicketData.current} onClose={() => {
                setLookUpOpen(false)
                lookUpTicketData.current = undefined
            }}/>
        </VStack>
    )
}

function TicketDisplayEntry(params: {
    ticketColor: string,
    ticketNum: string,
    ticketId: string,
    onClick: () => void
}) {
    return (
        <Box key={params.ticketId} backgroundColor={params.ticketColor} w={"8rem"} p={2}
             borderRadius={5} flexShrink={0} flexGrow={0} onClick={params.onClick}
             cursor={"pointer"}>
            <Center>
                <Heading>{params.ticketNum}</Heading>
            </Center>
        </Box>
    )
}

function TicketLookUpModal(params: {
    isOpen: boolean,
    ticketData: PrettyTicket | undefined,
    onClose: () => void
}) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    useEffect(() => {
        if (isOpen) return
        if (params.isOpen && params.ticketData) onOpen()
    }, [params.isOpen, params.ticketData]);

    function onCloseProxy() {
        params.onClose()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onCloseProxy}>
            <ModalOverlay/>
            <ModalContent>
                <ModalCloseButton/>
                <ModalHeader>
                    <Text>食券詳細</Text>
                </ModalHeader>
                <ModalBody>
                    {params.ticketData && <TicketCard ticket={params.ticketData}/>}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}