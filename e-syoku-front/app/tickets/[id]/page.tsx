"use client"
import {useParams} from "next/navigation";
import PageTitle from "@/components/pageTitle";

export default function Page() {
    const param = useParams()
    const id = param["id"]!!

    return (
        <>
            <PageTitle title={"食券番号 " + id}></PageTitle>
            <div className={"w-full h-max p-3 mx-2 shadow-2xl rounded-2xl flex flex-col justify-center items-start"}>
                <div className={"w-full py-5 m-2 flex flex-col items-center justify-center bg-gray-100 rounded-2xl space-y-1"}>
                    <div className={""}>食券番号</div>
                    <div className={"font-bold text-xl"}>{id}</div>
                </div>
                <div>只今準備中です。呼び出しまでお待ちください。</div>
                <div>注文内容：</div>
            </div>
        </>
    );
}