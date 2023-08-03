"use client"
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, Flex, Heading, HStack, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {Box} from "@chakra-ui/react";
import {useEffect, useRef} from "react";

export default function Page() {
    const params = useSearchParams()
    const shopId = params.get("shopId") ?? undefined

    return (
        <>
            <PageTitle title={"TicketDisplay"}/>
            <APIEndpoint endpoint={ticketDisplayEndpoint} query={{shopId: shopId}}
                         onEnd={(response, reload) => {
                             const processing = response.data.displays.filter((display) => display.status === "PROCESSING")
                             const called = response.data.displays.filter((display) => display.status === "CALLED")
                             const informed = response.data.displays.filter((display) => display.status === "INFORMED")
                             const resolved = response.data.displays.filter((display) => display.status === "RESOLVED")


                             return (
                                 <VStack>
                                     <TicketDisplay displays={processing} ticketStatus={"調理中"}
                                                    ticketColor={"gray.200"} autoScroll={true}/>
                                     <TicketDisplay displays={called} ticketStatus={"受け渡し可能"}
                                                    ticketColor={"green.200"} autoScroll={false}/>
                                     {informed.length > 0 && (
                                         <TicketDisplay displays={informed} ticketStatus={"お呼び出し"}
                                                        ticketColor={"blue.200"} autoScroll={true}/>)}
                                     <Btn onClick={reload}>再読み込み</Btn>
                                 </VStack>
                             )
                         }} queryNotSatisfied={() => {
                return (
                    <>
                        <Center>
                            <Heading>shopIdが指定されていません</Heading>
                        </Center>
                    </>
                )
            }}/>
        </>
    )
}

function TicketDisplay(props: {
    displays: { ticketId: string, ticketNum: string }[],
    ticketStatus: string,
    ticketColor: string,
    autoScroll: boolean
}) {
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
        if(listElement.current != null){
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
        if (props.autoScroll) {
            move()
        }
    }, [])

    return (
        <Flex direction={"column"} alignContent={"start"} w={"100%"}>
            <Heading>{props.ticketStatus}</Heading>
            <Box h={"1rem"}/>
            <HStack spacing={"2rem"} overflowX={"scroll"} w={"100%"} px={2} ref={listElement}>
                {props.displays.map((display) => {
                    return (
                        <Box key={display.ticketId} backgroundColor={props.ticketColor} w={"8rem"} p={2}
                             borderRadius={5} flexShrink={0} flexGrow={0}>
                            <Center>
                                <Heading>{display.ticketNum}</Heading>
                            </Center>
                        </Box>
                    )
                })}
            </HStack>
        </Flex>
    )
}