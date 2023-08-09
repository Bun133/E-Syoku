import {
    EndPoint,
    EndPointErrorResponse,
    EndPointResponse,
    EndPointSuccessResponse,
    useLazyEndpoint
} from "@/lib/e-syoku-api/Axios";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import React, {useEffect, useRef} from "react";
import {Box, Container, Spinner, Text} from "@chakra-ui/react";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export function APIEndpoint<Q, R extends DefaultResponseFormat>(param: {
    endpoint: EndPoint<Q, R>,
    query: Partial<Q>,
    onEnd: (response: EndPointSuccessResponse<R>, reload: () => void) => React.JSX.Element,
    loading?: () => React.JSX.Element,
    // QueryがQに合わない時に表示するやつ(普通は一瞬しか表示されない・そもそも表示されないはずので、エラー画面にするのがいい)
    queryNotSatisfied?: () => React.JSX.Element
}) {
    const loadingFunc = param.loading ?? defaultLoading;
    const queryErrorFunc = param.queryNotSatisfied ?? defaultQueryError;

    const {fetch: reload} = useLazyEndpoint(param.endpoint)
    const cached = useRef<EndPointResponse<R>>()
    const isQueryNotSatisfied = useRef(false)

    async function reloadFunc() {
        cached.current = undefined
        const req = param.endpoint.requestType.safeParse(param.query)
        if (req.success) {
            isQueryNotSatisfied.current = false
            cached.current = await reload(req.data)
        } else {
            isQueryNotSatisfied.current = true
        }
    }

    useEffect(() => {
        reloadFunc()
    }, [param.query])

    if (isQueryNotSatisfied.current) {
        return queryErrorFunc()
    }

    if (cached.current === undefined) {
        return loadingFunc()
    } else {
        if (cached.current.data === undefined) {
            return (
                <APIErrorModal error={cached.current as EndPointErrorResponse<R>}/>
            )
        } else {
            return param.onEnd(cached.current as EndPointSuccessResponse<R>, () => {
                reloadFunc()
            })
        }
    }
}

function defaultLoading(): React.JSX.Element {
    return (
        <Box h={"100%"}>
            <Center>
                <Spinner thickness={"4px"} speed={"0.45s"} emptyColor={"gray.200"} size={"xl"}
                         color={"blue.500"}/>
            </Center>
        </Box>
    )
}

function defaultQueryError() {
    return (
        <Container>
            <VStack>
                <Heading>エラー</Heading>
                <Text>
                    情報が不足しています
                </Text>
            </VStack>
        </Container>
    )
}