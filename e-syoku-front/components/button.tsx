import React from "react";
import Link from "next/link";

export default function Button(props: {
    href?: string, children: React.ReactNode,
    onClick?: () => void
}) {
    if (props.href) {
        return (
            <Link href={props.href} className="p-2 bg-green-400 rounded-xl m-2" onClick={props.onClick}>
                {props.children}
            </Link>
        );
    } else {
        return (
            <div className="p-2 bg-green-400 rounded-xl m-2 hover:cursor-pointer hover:bg-green-500" onClick={props.onClick}>
                {props.children}
            </div>
        )
    }
}