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
                                                    ticketColor={"green.200"} autoScroll={true}/>
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
    const startElement = useRef<HTMLDivElement>(null)
    const endElement = useRef<HTMLDivElement>(null)
    const isToEnd = useRef(true)

    const duration = 2000

    useEffect(() => {
        if (props.autoScroll) {
            const scroll = () => {
                if (isToEnd.current) {
                    endElement.current?.scrollIntoView({behavior: "smooth"})
                    isToEnd.current = false
                } else {
                    startElement.current?.scrollIntoView({behavior: "smooth"})
                    isToEnd.current = true
                }

                setTimeout(scroll, duration)
            }
            setTimeout(scroll, duration)
        }
    }, [])

    return (
        <Flex direction={"column"} alignContent={"start"} w={"100%"}>
            <Heading>{props.ticketStatus}</Heading>
            <Box h={"1rem"}/>
            <HStack spacing={"2rem"} overflowX={"scroll"} w={"100%"} px={2}>
                <div ref={startElement}/>
                {props.displays.map((display) => {
                    return (
                        <Box key={display.ticketId} backgroundColor={props.ticketColor} w={"7rem"} p={2}
                             borderRadius={5} flexShrink={0} flexGrow={0}>
                            <Center>
                                <Heading>{display.ticketNum}</Heading>
                            </Center>
                        </Box>
                    )
                })}
                <div ref={endElement}/>
            </HStack>
        </Flex>
    )
}