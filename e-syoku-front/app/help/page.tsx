"use client"
import {useSearchParams} from "next/navigation";
import {ErrorMdComponent} from "@/components/error/ErrorMdComponent";

export default function Page() {
    const params = useSearchParams()
    const errorCode = params.get("code") ?? ""
    return <ErrorMdComponent errorCode={errorCode}/>
}