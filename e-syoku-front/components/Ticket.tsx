import Btn from "@/components/btn";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";
import {Card, CardBody, CardFooter, CardHeader} from "@chakra-ui/card";
import {Box} from "@chakra-ui/react";
import {Center, Heading} from "@chakra-ui/layout";


export default function TicketComponent(param: {
    ticket: Ticket,
    button?: ReactNode
}) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/tickets/id?id=" + param.ticket.uniqueId}>
            詳しく見る
        </Btn>);


    return (
        <Card>
            <CardHeader>
                <Box backgroundColor={"gray.200"} borderRadius={10} px={4} py={1}>
                    <Center>
                        <Heading>
                            {param.ticket.ticketNum}
                        </Heading>
                    </Center>
                </Box>
            </CardHeader>
            <CardFooter>
                {button}
            </CardFooter>
        </Card>
    )
}