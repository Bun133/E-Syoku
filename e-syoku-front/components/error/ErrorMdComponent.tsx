import {Suspense} from "react";
import {Container} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";

export function ErrorMdComponent(params: { errorCode: string }) {
    return (
        <Suspense fallback={null}>
            {/* @ts-expect-error Server Component */}
            <MdComponent errorCode={params.errorCode}/>
        </Suspense>
    )
}

async function MdComponent(params: { errorCode: string }) {
    const path = mdName(params.errorCode) ?? "test.md"

    let d = await fetch(`/error/${path}`, {
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

function mdName(errorCode: string): string | undefined {
    switch (errorCode) {
        case "test":
        case "ITEM_GONE":
        case "INPUT_WRONG_PAIDAMOUNT":
        case "INPUT_WRONG_BARCODE":
        case "TICKET_STATUS_INVALID":
            return `${errorCode}.md`
        default:
            return "default.md"
    }
}