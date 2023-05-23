"use client"

import PageTitle from "@/components/pageTitle";
import {ListSelectionPrimitive} from "@/components/select/ListSelection";
import {useState} from "react";

export default function Page() {
    let [firstLetter, setFirstLetter] = useState<string>()
    let [num, setNum] = useState<number>()

    return (
        <div>
            <PageTitle title="食券登録"></PageTitle>
            <div className="flex flex-col items-center justify-start space-y-1">
                <h1>食券番号を入力してください</h1>
                <div className="flex flex-row items-center space-x-3">
                    <ListSelectionPrimitive values={["A", "B", "C"]} selected={(it) => {
                        setFirstLetter(it)
                    }}></ListSelectionPrimitive>
                    <div className="font-bold">
                        -
                    </div>
                    <ListSelectionPrimitive values={[0, 1, 2, 3]} selected={(it) => {
                        setNum(it)
                    }}></ListSelectionPrimitive>
                </div>

                <div className="font-bold">
                    {firstLetter} - {num}
                </div>
            </div>
        </div>
    );
}