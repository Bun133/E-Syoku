"use client"
import {useParams} from "next/navigation";

export default function () {
    const id = useParams()["id"]
    return (
        <div>
            {id}
        </div>
    )
}