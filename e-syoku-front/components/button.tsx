import React from "react";
import Link from "next/link";

export default function Button(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void, className?: string
}) {
    if (props.href) {
        return (
            <Link href={props.href} onClick={props.onClick} className={props.className}>
                <div onClick={props.onClick}>{props.children}</div>
            </Link>
        );
    } else {
        return (
            <div onClick={props.onClick} className={props.className}>{props.children}</div>
        )
    }
}