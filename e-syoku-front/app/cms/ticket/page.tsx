"use client"
import React, {useRef, useState} from "react";
import {PrettyTicket, Ticket} from "@/lib/e-syoku-api/Types";
import {Flex, HStack, VStack} from "@chakra-ui/layout";
import {BarcodeReader} from "@/components/reader/BarcodeReader";
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {cmsTicketEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";
import {Input, InputGroup} from "@chakra-ui/react";
import {ArrowRight} from "react-feather";
import Btn from "@/components/btn";
import {TicketCard} from "@/components/Ticket";

export default function Page() {
    const [ticket, setTicket] = useState<PrettyTicket>()
    const token = useFirebaseAuth()
    const [error, setError] = useState<EndPointErrorResponse<any>>()
    const uid = useRef<string>()
    const ticketId = useRef<string>()

    function reset() {
        setTicket(undefined)
        setError(undefined)
    }

    async function handle(barcode?: string, uid?: string, ticketId?: string) {
        const res = await callEndpoint(cmsTicketEndpoint, await token.waitForUser(), {
            barcode: barcode,
            uid: uid,
            ticketId: ticketId
        })


        if (res.isSuccess) {
            if (res.data.ticket) {
                setTicket(res.data.ticket)
            } else {
                // TODO
            }
        } else {
            setError(res)
        }
    }

    return (
        <VStack>
            <Flex>
                <BarcodeReader onRead={async (barcode) => {
                    reset()
                    await handle(barcode, undefined, undefined)
                }} autoSelect={false}/>
                <Flex>
                    <HStack>
                        <InputGroup>
                            <Input type={"text"} placeholder={"UID"} onChange={e => {
                                uid.current = e.target.value
                            }}/>
                        </InputGroup>
                        <InputGroup>
                            <Input type={"text"} placeholder={"TicketID"} onChange={e => {
                                ticketId.current = e.target.value
                            }}/>
                        </InputGroup>
                    </HStack>
                    <Btn onClick={async () => {
                        reset()
                        await handle(undefined, uid.current, ticketId.current)
                    }}>
                        <ArrowRight/>
                    </Btn>
                </Flex>
            </Flex>
            {ticket !== undefined ? <TicketCard ticket={ticket}/> : null}
            <APIErrorModal error={error}/>
        </VStack>
    )
}