"use client"

import React, {useState} from "react";
import Link from "next/link";
import {Button} from "@chakra-ui/react";

export default function Btn(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void | Promise<void>, className?: string,
    disabled?: boolean,
}) {
    const disabled = props.disabled != undefined ? props.disabled : false;
    const [isLoading, setLoading] = useState<boolean>(false)
    const onClickProxy = (e: React.MouseEvent<any>) => {
        if (props.onClick != undefined && !disabled) {
            const r = props.onClick()
            //check if r is promise
            if (r instanceof Promise) {
                setLoading(true)
                r.then(() => {
                    setLoading(false)
                })
            } else {
                setLoading(false)
            }
        }
    }
    if (props.href && !disabled) {
        return (
            <Link href={props.href} onClick={onClickProxy} className={props.className}>
                <Button isDisabled={disabled} colorScheme={"blue"} variant={"solid"} flexShrink={0}
                        onClick={onClickProxy} isLoading={isLoading}>{props.children}</Button>
            </Link>
        );
    } else {
        return (
            <Button isDisabled={disabled} colorScheme={"blue"} variant={"solid"} onClick={onClickProxy} flexShrink={0}
                    className={props.className} isLoading={isLoading}>{props.children}</Button>
        )
    }
}