"use client"
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";

export default function () {
    const {response: data} = useEndpoint(listGoodsEndPoint, {})
    if (data) {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <Center>
                    {data.data!.data.map((d, index) => {
                        return (
                            <div>
                                {d.key.name + ":" + d.key.goodsId + ":" + JSON.stringify(d.value)}
                            </div>
                        )
                    })}
                </Center>
            </div>
        )

    } else {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <Center>
                    <Loader></Loader>
                </Center>
            </div>
        )
    }
}