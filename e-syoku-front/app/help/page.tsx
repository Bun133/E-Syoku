"use client"
import {useSearchParams} from "next/navigation";
import {Suspense} from "react";
import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import {Container} from "@chakra-ui/react";

export default function Page() {
    const params = useSearchParams()
    const errorCode = params.get("code") ?? ""
    return <ErrorMdComponent errorCode={errorCode}/>
}

export function ErrorMdComponent(params: { errorCode: string }) {
    return (
        <Suspense fallback={null}>
            {/* @ts-expect-error Server Component */}
            <MdComponent errorCode={params.errorCode}/>
        </Suspense>
    )
}

async function MdComponent(params: { errorCode: string }) {
    let d = await fetch(`/error/${mdName(params.errorCode)}`, {
        cache: "force-cache",
    })
    let text = await d.text()

    return (
        <Container>
            <ReactMarkdown components={ChakraUIRenderer()}>
                {text}
            </ReactMarkdown>
        </Container>
    )
}

function mdName(errorCode: string): string {
    return errorCode + ".md"
}