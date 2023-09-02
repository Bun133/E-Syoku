import React from "react";
import {HStack} from "@chakra-ui/layout";
import {AlertCircle} from "react-feather";
import {Box, Text} from "@chakra-ui/react";

export function InfoBox(params:{
    children:React.ReactNode
}){
    return (
        <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"blue.300"} bgColor={"blue.100"}>
            <HStack>
                <AlertCircle color={"#3182ce"} size={24}/>
                <Text fontSize={"2xl"}>
                    注意
                </Text>
            </HStack>

            {params.children}
        </Box>
    )
}