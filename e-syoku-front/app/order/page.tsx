"use client"
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Loader} from "react-feather";
import {Center} from "@chakra-ui/layout";
import Goods from "@/components/goods";
import {OrderSelection} from "@/components/form/OrderSelection";

export default function () {
    const {response: data} = useEndpoint(listGoodsEndPoint, {})
    if (data) {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <OrderSelection goods={data.data!.data} callBack={console.log}></OrderSelection>
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