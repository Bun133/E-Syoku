"use client"

import React from "react";
import Link from "next/link";
import {Button} from "@chakra-ui/react";

export default function Btn(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void, className?: string
}) {
    if (props.href) {
        return (
            <Link href={props.href} onClick={props.onClick} className={props.className}>
                <Button colorScheme={"blue"} variant={"solid"} onClick={props.onClick}>{props.children}</Button>
            </Link>
        );
    } else {
        return (
            <Button colorScheme={"blue"} variant={"solid"} onClick={props.onClick} className={props.className}>{props.children}</Button>
        )
    }
}