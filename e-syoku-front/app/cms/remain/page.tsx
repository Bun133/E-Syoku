"use client"
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {cmsRemainEndpoint} from "@/lib/e-syoku-api/EndPoints";
import {GoodsRemainData, PrettyGoods} from "@/lib/e-syoku-api/Types";
import {HStack, VStack} from "@chakra-ui/layout";
import {Spacer, Text} from "@chakra-ui/react";
import Btn from "@/components/btn";

export default function Page() {
    return (
        <APIEndpoint endpoint={cmsRemainEndpoint} query={{}} onEnd={(response, reload) => {
            return (
                <RemainData data={response.data.remainData!!}/>
            )
        }}/>
    )
}

type Data = { goods: PrettyGoods, remain: GoodsRemainData }

function RemainData(params: { data: Data[] }) {
    return (
        <VStack w={"full"}>
            {params.data.map(e => {
                return (
                    <HStack key={e.goods.goodsId} w={"full"} borderColor={"black.500"} borderWidth={2} p={2}>
                        <Text>{e.goods.name}</Text>
                        <Spacer/>
                        <Text>{e.goods.shop.name}</Text>
                        <Spacer/>
                        <Text>{remainDataString(e.remain)}</Text>
                        <Spacer/>
                        <Btn href={`/cms/remain/id?goodsId=${e.goods.goodsId}`}>在庫更新</Btn>
                    </HStack>
                )
            })}
        </VStack>
    )
}

function remainDataString(remainData: GoodsRemainData): string {
    // @ts-ignore
    if (remainData.remainCount !== undefined) {
        // @ts-ignore
        return remainData.remainCount.toString()
    } else {
        // @ts-ignore
        return remainData.remain.toString()
    }
}