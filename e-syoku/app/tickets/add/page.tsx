"use client"

import PageTitle from "@/components/pageTitle";
import {ListSelectionString} from "@/components/select/ListSelection";
import {useState} from "react";

export default function Page() {
    var [selected, setSelected] = useState<string>()

    return (
        <div>
            <PageTitle title="食券登録"></PageTitle>
            <div className="flex flex-col items-center justify-start space-y-1">
                <h1>食券番号を入力してください</h1>
                <div className="flex flex-row items-center">
                    <ListSelectionString values={["a", "b", "c"]} selected={(it) => {
                        setSelected(it)
                    }}></ListSelectionString>

                    selected:{selected}
                </div>
            </div>
        </div>
    );
}