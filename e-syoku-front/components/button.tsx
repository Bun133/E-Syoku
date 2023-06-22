import React from "react";
import Link from "next/link";
import {Button as TremorButton} from "@tremor/react";

export default function Button(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void, className?: string
}) {
    if (props.href) {
        return (
            <Link href={props.href} onClick={props.onClick} className={props.className}>
                <TremorButton onClick={props.onClick}>{props.children}</TremorButton>
            </Link>
        );
    } else {
        return (
            <TremorButton onClick={props.onClick} className={props.className}>{props.children}</TremorButton>
        )
    }
}