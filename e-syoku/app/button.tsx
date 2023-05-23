import React from "react";

export default function Button(props: {
    href: string,children: React.ReactNode
}) {
    return (
        <a href={props.href} className="p-2 bg-green-400 rounded-xl m-2">
            {props.children}
        </a>
    );
}