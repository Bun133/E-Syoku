import {EndPoint, EndPointErrorResponse, EndPointSuccessResponse, useLazyEndpoint} from "@/lib/e-syoku-api/Axios";
import {DefaultResponseFormat} from "@/lib/e-syoku-api/Types";
import React, {useEffect, useRef} from "react";
import {Box, Container, Spinner, Text} from "@chakra-ui/react";
import {Center, Heading, VStack} from "@chakra-ui/layout";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export type RefetchOption = {
    // 次のfetchまでの間隔(sec)
    interval: number,
}

export function APIEndpoint<Q, R extends DefaultResponseFormat>(param: {
    endpoint: EndPoint<Q, R>,
    query: Partial<Q>,
    onEnd: (response: EndPointSuccessResponse<R>, reload: () => Promise<void>) => React.JSX.Element,
    loading?: () => React.JSX.Element,
    // QueryがQに合わない時に表示するやつ(普通は一瞬しか表示されない・そもそも表示されないはずので、エラー画面にするのがいい)
    queryNotSatisfied?: () => React.JSX.Element,
    refetch?: RefetchOption,
    // 前回のFetch結果が残ってる時にloadingで表示を更新しないフラグ
    disableLoading?: boolean
}) {
    const loadingFunc = param.loading ?? defaultLoading;
    const queryErrorFunc = param.queryNotSatisfied ?? defaultQueryError;

    const {response, isLoaded, fetch: fetch} = useLazyEndpoint(param.endpoint)
    const isQueryNotSatisfied = useRef(false)

    async function reloadFunc() {
        const req = param.endpoint.requestType.safeParse(param.query)
        isQueryNotSatisfied.current = !req.success;
        if (req.success) {
            await fetch(req.data)
        }
    }

    useEffect(() => {
        reloadFunc()
    }, [param.query])

    useEffect(() => {
        if (param.refetch) {
            const interval = setInterval(reloadFunc, param.refetch.interval * 1000)
            return () => {
                clearInterval(interval)
            }
        }
    }, [param.refetch]);

    function displayResponse() {
        if (response!!.data === undefined) {
            return (
                <APIErrorModal error={response!! as EndPointErrorResponse<R>}/>
            )
        } else {
            return param.onEnd(response!! as EndPointSuccessResponse<R>, async () => {
                await reloadFunc()
            })
        }
    }

    if (isQueryNotSatisfied.current) {
        return queryErrorFunc()
    }

    if (!isLoaded) {
        if (!(param.disableLoading ?? false) || !response) {
            return loadingFunc()
        }
    }

    return displayResponse()
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