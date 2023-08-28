"use client"
import {allHelpEntries} from "@/lib/e-syoku-api/help/HelpEntries";
import {Box, Text, VStack} from "@chakra-ui/react";
import {Card, CardBody, CardFooter} from "@chakra-ui/card";
import Btn from "@/components/btn";

export default function Page() {
    const entries = allHelpEntries()

    return (
        <VStack w={"full"}>
            {entries.map((entry, index) => (
                <Box p={2} m={2} w={"full"} key={index}>
                    <Card>
                        <CardBody>
                            <Text>{entry.mdFileName}</Text>
                        </CardBody>
                        <CardFooter>
                            <Btn href={`/help?fs=${entry.mdFileName}`}>開く</Btn>
                        </CardFooter>
                    </Card>
                </Box>
            ))}
        </VStack>
    )
}