"use client"

import React from "react";
import Link from "next/link";
import {Button} from "@chakra-ui/react";

export default function Btn(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void, className?: string,
    disabled?: boolean
}) {
    const disabled = props.disabled != undefined ? props.disabled : false;
    const onClickProxy = (e: React.MouseEvent<any>) => {
        if (props.onClick != undefined && !disabled) {
            props.onClick();
        }
    }
    if (props.href && !disabled) {
        return (
            <Link href={props.href} onClick={onClickProxy} className={props.className}>
                <Button isDisabled={disabled} colorScheme={"blue"} variant={"solid"}
                        onClick={onClickProxy}>{props.children}</Button>
            </Link>
        );
    } else {
        return (
            <Button isDisabled={disabled} colorScheme={"blue"} variant={"solid"} onClick={onClickProxy}
                    className={props.className}>{props.children}</Button>
        )
    }
}