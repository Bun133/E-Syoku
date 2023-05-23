"use client"
import {useParams} from "next/navigation";

export default function Page() {
    const param = useParams()

    return (
        <div>ID:{param["id"]}</div>
    );
}