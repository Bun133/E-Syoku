import React from "react";
import Link from "next/link";

export default function Button(props: {
    href: string,children: React.ReactNode
}) {
    return (
        <Link href={props.href} className="p-2 bg-green-400 rounded-xl m-2">
            {props.children}
        </Link>
    );
}