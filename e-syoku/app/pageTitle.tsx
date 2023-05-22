"use client";
import {ArrowLeft} from "react-feather";

export default function PageTitle(param: { title: string }) {
    return (
        <div>
            <div className="flex flex-row justify-start items-center space-x-2 px-2">
                <button onClick={backButtonClick}><ArrowLeft></ArrowLeft></button>
                <h1 className="text-xl p-2">食券一覧</h1>
            </div>
            <hr></hr>
        </div>
    );
}

function backButtonClick() {
    history.back()
}