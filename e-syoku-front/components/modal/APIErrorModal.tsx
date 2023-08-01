import {EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {useDisclosure} from "@chakra-ui/hooks";
import React, {useRef} from "react";
import {MessageModal} from "@/components/modal/MessageModal";
import {Code} from "@chakra-ui/react";

export function APIErrorModal(params: {
    error: EndPointErrorResponse<any> | undefined
}) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const message = useRef<React.ReactNode[]>()
    if (params.error && !isOpen) {
        message.current = [<p>エラーが発生しました</p>, <p>エラーコード:{params.error.errorCode}</p>,
            <p>エラーメッセージ:{params.error.error}</p>, (<><p>スタック情報:</p><Code>{params.error.stack}</Code></>)]
        onOpen()
    } else if (!params.error && isOpen) {
        onClose()
    }

    return (
        <MessageModal message={message.current ?? []} isOpen={isOpen} onClose={onClose}/>
    )
}