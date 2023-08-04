import {EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {useDisclosure} from "@chakra-ui/hooks";
import React, {useEffect, useRef} from "react";
import {MessageModal} from "@/components/modal/MessageModal";
import {Code} from "@chakra-ui/react";

export function APIErrorModal(params: {
    error: EndPointErrorResponse<any> | undefined
}) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const message = useRef<React.ReactNode[]>()

    useEffect(()=>{
        if (params.error && !isOpen) {
            message.current = [<p key={"title"}>エラーが発生しました</p>, <p key={"code"}>エラーコード:{params.error.errorCode}</p>,
                <p key={"message"}>エラーメッセージ:{params.error.error}</p>, (<div key={"stack"}><p>スタック情報:</p><Code>{params.error.stack}</Code></div>)]
            onOpen()
        } else if (!params.error && isOpen) {
            onClose()
        }
    },[params.error])

    return (
        <MessageModal message={message.current ?? []} isOpen={isOpen} onClose={onClose}/>
    )
}