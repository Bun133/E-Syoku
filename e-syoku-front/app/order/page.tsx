"use client"
import {useEndpoint} from "@/lib/e-syoku-api/Axios";
import {listGoodsEndPoint} from "@/lib/e-syoku-api/EndPoints";
import PageTitle from "@/components/pageTitle";
import {Loader} from "react-feather";

export default function () {
    const {response: data} = useEndpoint(listGoodsEndPoint, {})
    if (data) {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <div className={"flex flex-row flex-wrap justify-start items-start"}>
                    {data.data!.data.map((d, index) => {
                        return (
                            <div>
                                {d.key.name + ":" + d.key.goodsId + ":" + JSON.stringify(d.value)}
                            </div>
                        )
                    })}
                </div>
            </div>
        )

    } else {
        return (
            <div>
                <PageTitle title={"商品一覧"}></PageTitle>
                <div className={"flex flex-col justify-center items-center"}>
                    <Loader></Loader>
                </div>
            </div>
        )
    }
}