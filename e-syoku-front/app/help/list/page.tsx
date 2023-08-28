"use client"
import {allHelpEntries} from "@/lib/e-syoku-api/help/HelpEntries";
import {Box, Spacer, Text, VStack} from "@chakra-ui/react";
import {Card, CardBody, CardFooter} from "@chakra-ui/card";
import Btn from "@/components/btn";
import {HStack} from "@chakra-ui/layout";

export default function Page() {
    const entries = allHelpEntries()
    const helpEntries = entries.filter(e => e.displayName !== undefined)

    return (
        <VStack w={"full"}>
            {helpEntries.map((entry, index) => (
                <Box p={2} m={2} w={"full"} key={index}>
                    <Card>
                        <CardBody>
                            <Text>{entry.displayName}</Text>
                        </CardBody>
                        <CardFooter>
                            <HStack w={"full"}>
                                <Spacer/>
                                <Btn href={`/help?fs=${entry.mdFileName}`}>開く</Btn>
                            </HStack>
                        </CardFooter>
                    </Card>
                </Box>
            ))}
        </VStack>
    )
}