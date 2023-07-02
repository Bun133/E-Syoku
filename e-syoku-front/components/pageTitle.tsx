"use client";
import {ArrowLeft} from "react-feather";
import {Divider, Flex, Heading, VStack} from "@chakra-ui/layout";
import Btn from "@/components/btn";

export default function PageTitle(param: { title: string }) {
    return (
        <VStack>
            <Flex direction={"row"} w={"full"}>
                <Btn onClick={backButtonClick}><ArrowLeft></ArrowLeft></Btn>
                <Heading px={3}>{param.title}</Heading>
            </Flex>
            <Divider></Divider>
        </VStack>
    );
}

function backButtonClick() {
    history.back()
}