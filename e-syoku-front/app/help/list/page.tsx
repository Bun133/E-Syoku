"use client"
import {allHelpEntries, HelpEntry} from "@/lib/e-syoku-api/help/HelpEntries";
import {Badge, Box, Spacer, Text, VStack} from "@chakra-ui/react";
import {Card, CardBody, CardFooter} from "@chakra-ui/card";
import Btn from "@/components/btn";
import {HStack} from "@chakra-ui/layout";
import {CashierOnly, ShopOnly} from "@/lib/e-syoku-api/AuthTypeProvider";

export default function Page() {
    const entries = allHelpEntries()
    const helpEntries = entries.filter(e => e.displayName !== undefined)
    const shopEntries = helpEntries.filter(e => e.isToShop)
    const cashierEntries = helpEntries.filter(e => e.isToCashier)
    const normalEntries = helpEntries.filter(e => !e.isToShop && !e.isToCashier)

    return (
        <VStack w={"full"}>
            <ShopOnly>
                {shopEntries.map((entry, index) => (
                    <HelpComponent key={index} help={entry} isShop={true}/>
                ))}
            </ShopOnly>
            <CashierOnly>
                {cashierEntries.map((entry, index) => (
                    <HelpComponent key={index} help={entry} isCashier={true}/>
                ))}
            </CashierOnly>
            {normalEntries.map((entry, index) => (
                <HelpComponent key={index} help={entry}/>
            ))}
        </VStack>
    )
}

function HelpComponent(params: { help: HelpEntry, isShop?: boolean, isCashier?: boolean }) {
    const entry = params.help
    return (
        <Box p={2} m={2} w={"full"}>
            <Card>
                <CardBody>
                    {(params.isShop ?? false) && <Badge colorScheme={"green"}>店舗</Badge>}
                    {(params.isCashier ?? false) && <Badge colorScheme={"blue"}>決済担当</Badge>}
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
    )
}