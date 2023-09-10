"use client"
import {MdComponent} from "@/components/error/ErrorMdComponent";
import {useSearchParams} from "next/navigation";

export default function Page(){
    // force client-side rendering
    const _ = useSearchParams()
    return (
        <MdComponent mdFileName={"terms.md"}/>
    )
}