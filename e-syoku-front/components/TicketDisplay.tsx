import {PrettyTicket} from "@/lib/e-syoku-api/Types";
import {Center, Heading, HStack, VStack} from "@chakra-ui/layout";
import {useEffect, useRef} from "react";
import {Box} from "@chakra-ui/react";
import {ticketColor} from "@/components/Ticket";

export type DisplaySelection = {
    processing: boolean,
    called: boolean,
    informed: boolean,
    resolved: boolean,
}

const defaultDisplaySelection: DisplaySelection = {
    processing: true,
    called: true,
    informed: false,
    resolved: false,
}

export function TicketDisplay(params: {
    data: PrettyTicket[],
    displaySelection?: DisplaySelection
}) {
    const selection = params.displaySelection ?? defaultDisplaySelection
    const sorted = params.data.sort((a, b) => a.lastStatusUpdated.utcSeconds - b.lastStatusUpdated.utcSeconds)
    const processing = sorted.filter(e => e.status === "注文済み")
    const called = sorted.filter(e => e.status === "受け取り待ち")
    const informed = sorted.filter(e => e.status === "お知らせ")
    const resolved = sorted.filter(e => e.status === "完了")

    return (
        <VStack w={"full"} h={"full"} flexShrink={1}>
            {selection.processing &&
                <TicketDisplayRow title={"調理中"} displays={processing} ticketColor={ticketColor("調理中")}/>}
            {selection.resolved &&
                <TicketDisplayRow title={"受け渡し可能"} displays={called} ticketColor={ticketColor("受け取り待ち")}/>}
            {selection.informed &&
                <TicketDisplayRow title={"お呼び出し"} displays={informed} ticketColor={ticketColor("お知らせ")}/>}
            {selection.resolved &&
                <TicketDisplayRow title={"完了"} displays={resolved} ticketColor={ticketColor("完了")}/>}
        </VStack>
    )
}

function TicketDisplayRow(props: { title: string, displays: PrettyTicket[], ticketColor: string }) {
    const duration = 2000
    const currentIndex = useRef(0)
    const listElement = useRef<HTMLDivElement>(null)

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
        move()
    }, [])

    return (
        <VStack align={"flex-start"} w={"full"}>
            <Heading>{props.title}</Heading>
            <Box h={"1rem"}/>
            <HStack spacing={"2rem"} overflowX={"scroll"} w={"full"} px={2} ref={listElement}>
                {props.displays.map((display) => {
                    return (
                        <Box key={display.uniqueId} backgroundColor={props.ticketColor} w={"8rem"} p={2}
                             borderRadius={5} flexShrink={0} flexGrow={0}>
                            <Center>
                                <Heading>{display.ticketNum}</Heading>
                            </Center>
                        </Box>
                    )
                })}
            </HStack>
        </VStack>
    )
}