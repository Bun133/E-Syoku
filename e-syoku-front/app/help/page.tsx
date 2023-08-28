"use client"
import {useSearchParams} from "next/navigation";
import {MdComponent} from "@/components/error/ErrorMdComponent";

export default function Page() {
    const params = useSearchParams()
    const fileName = params.get("fs") ?? ""
    return <MdComponent mdFileName={fileName}/>
}