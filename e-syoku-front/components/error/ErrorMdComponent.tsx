import {Suspense} from "react";
import {Container} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import {findHelpEntry} from "@/lib/e-syoku-api/help/HelpEntries";

export function ErrorMdComponent(params: { errorCode: string }) {
    const fileName = findHelpEntry(params.errorCode).mdFileName
    return (
        <MdComponent mdFileName={fileName}/>
    )
}

export function MdComponent(params: { mdFileName: string }) {
    return (
        <Suspense fallback={null}>
            {/* @ts-expect-error Server Component */}
            <MdAsync mdFileName={params.mdFileName}/>
        </Suspense>
    )
}

async function MdAsync(params: { mdFileName: string }) {
    let d = await fetch(`/mds/${params.mdFileName}`, {
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