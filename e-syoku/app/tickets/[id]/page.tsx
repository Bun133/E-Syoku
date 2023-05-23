"use client"
import {useParams} from "next/navigation";

export default function Home() {
    const param = useParams()

    return (
        <div>ID:{param["id"]}</div>
    );
}