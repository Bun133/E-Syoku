import React from "react";
import {HStack} from "@chakra-ui/layout";
import {AlertCircle, AlertTriangle} from "react-feather";
import {Box, Text} from "@chakra-ui/react";

export function WarningBox(params:{
    children:React.ReactNode
}){
    return (
        <Box px={2} mx={2} borderWidth={2} borderRadius={8} borderColor={"orange.300"}
             bgColor={"orange.100"}>
            <HStack>
                <AlertTriangle color={"orange"} size={36}/>
                <Text fontSize={"3xl"}>
                    注意
                </Text>
            </HStack>
            {params.children}
        </Box>
    )
}