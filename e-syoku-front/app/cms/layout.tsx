"use client"
import {AdminOnly} from "@/lib/e-syoku-api/AuthTypeProvider";
import {Container} from "@chakra-ui/react";
import {Center} from "@chakra-ui/layout";
import React from "react";

export default function Layout(params: { children: React.JSX.Element }) {
    return (
        <AdminOnly children={params.children} fail={() => {
            return (
                <Container>
                    <Center>
                        このページは表示できません
                    </Center>
                </Container>
            )
        }}/>
    )
}