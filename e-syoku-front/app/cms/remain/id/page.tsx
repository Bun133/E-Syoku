"use client"
import {useRouter, useSearchParams} from "next/navigation";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {cmsRemainEndpoint, listGoodsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import {Center, HStack, VStack} from "@chakra-ui/layout";
import {Input, Radio, RadioGroup, Spacer, Text} from "@chakra-ui/react";
import {GoodsRemainData, GoodsWithRemainDataWaitingData} from "@/lib/e-syoku-api/Types";
import {useRef, useState} from "react";
import Btn from "@/components/btn";
import {callEndpoint, EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {useFirebaseAuth} from "@/lib/firebase/authentication";
import {APIErrorModal} from "@/components/modal/APIErrorModal";

export default function Page() {
    const params = useSearchParams()
    const goodsId = params.get("goodsId")

    return (
        <APIEndpoint endpoint={listGoodsEndPoint} query={{}} onEnd={(response) => {
            const matching = response.data.data.find(d => d.goods.goodsId === goodsId)
            if (!matching) {
                return (
                    <Center>
                        <Text>該当する商品が見つかりませんでした</Text>
                    </Center>
                )
            }

            return (
                <RemainDataInput data={matching} onSubmit={() => {

                }}/>
            )
        }}/>
    )
}

function RemainDataInput(params: {
    data: GoodsWithRemainDataWaitingData,
    onSubmit: (remainData: GoodsRemainData) => void
}) {
    const [op, setOp] = useState<"add" | "set">()
    const [amount, setAmount] = useState<number>()
    const auth = useFirebaseAuth()
    const err = useRef<EndPointErrorResponse<any>>()
    const router = useRouter()

    async function submit() {
        const r = await callEndpoint(cmsRemainEndpoint, await auth.waitForUser(), {op: op, goodsId: params.data.goods.goodsId, amount: amount})
        if (!r.isSuccess) {
            err.current = r
        }

        router.push("/cms/remain/changed")
    }


    return (
        <VStack>
            <Text>商品名：{params.data.goods.name}</Text>
            <Text>商品ID：{params.data.goods.goodsId}</Text>
            <Text>販売店舗名：{params.data.goods.shop.name}</Text>

            <Spacer/>

            <Text>在庫データを以下のように変更</Text>
            {/*@ts-ignore*/}
            <RadioGroup onChange={v => setOp(v)}>
                <HStack>
                    <Radio value={"add"}>追加</Radio>
                    <Radio value={"set"}>上書き</Radio>
                </HStack>
            </RadioGroup>

            <Input placeholder={"数量"} type={"number"} onChange={e => setAmount(Number(e.target.value))}/>

            <Btn onClick={submit} disabled={!op || !amount}>変更を送信</Btn>

            <APIErrorModal error={err.current}/>
        </VStack>
    )
}