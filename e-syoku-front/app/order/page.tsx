"use client"
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";
import Goods from "@/components/goods";

export default function () {
    const {response: data} = useEndpoint(listGoodsEndPoint, {})
    if (data) {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <Center>
                    {data.data!.data.map((d, index) => {
                        return (
                            <Goods goods={d.key}></Goods>
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