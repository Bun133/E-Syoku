"use client"
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {ticketDisplayEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";
import {useSearchParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";
import {TicketDisplay} from "@/components/TicketDisplay";

export default function Page() {
    const params = useSearchParams()
    const shopId = params.get("shopId") ?? undefined

    return (
        <>
            <PageTitle title={"TicketDisplay"}/>
            <APIEndpoint endpoint={ticketDisplayEndpoint} query={{shopId: shopId}}
                         onEnd={(response, reload) => {

                             return (
                                 <VStack>
                                     <TicketDisplay data={response.data.tickets}/>
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