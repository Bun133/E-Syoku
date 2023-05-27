"use client"
import {useParams} from "next/navigation";
import Button from "@/components/button";
import PageTitle from "@/components/pageTitle";

export default function () {
    const id = useParams()["id"]

    return (
        <>
            <PageTitle title={"食券番号確認"}></PageTitle>
            <div className="flex flex-col items-center justify-center h-full w-full space-y-2">
                <div className="text-xl">お持ちの食券番号は</div>
                <div className="text-5xl aspect-square flex items-center justify-center">{id}</div>
                <div className="text-xl">でお間違いありませんか?</div>

                <div className="flex flex-row justify-evenly items-center w-full">
                    <Button href={"/tickets/add/"}>キャンセル</Button>
                    <Button href={"/tickets/add/" + id + "/submit"}>続行</Button>
                </div>
            </div>
        </>
    )
}