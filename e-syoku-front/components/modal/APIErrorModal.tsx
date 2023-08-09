import {EndPointErrorResponse} from "@/lib/e-syoku-api/Axios";
import {useDisclosure} from "@chakra-ui/hooks";
import React, {useEffect} from "react";
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay
} from "@chakra-ui/modal";
import Btn from "@/components/btn";
import {Text} from "@chakra-ui/react";
import {ErrorMdComponent} from "@/components/error/ErrorMdComponent";

export function APIErrorModal(params: {
    error: EndPointErrorResponse<any> | undefined
}) {
    const {isOpen, onClose, onOpen} = useDisclosure()

    useEffect(() => {
        if (params.error) {
            onOpen()
        }
    }, [params.error])

    if (params.error) {
        return (
            <APIErrorModalBody errorCode={params.error.errorCode} isOpen={isOpen} onClose={onClose}/>
        )
    } else {
        return null
    }
}

function APIErrorModalBody(params: {
    errorCode: string, isOpen: boolean,
    onClose: () => void
}) {
    return (
        <Modal isOpen={params.isOpen} onClose={params.onClose} closeOnOverlayClick={false} scrollBehavior={"inside"}>
            <ModalOverlay/>
            <ModalContent>
                <ModalCloseButton/>
                <ModalHeader>
                    <Text>エラー:{params.errorCode}</Text>
                </ModalHeader>
                <ModalBody>
                    <ErrorMdComponent errorCode={params.errorCode}/>
                </ModalBody>
                <ModalFooter>
                    <Btn onClick={params.onClose}>閉じる</Btn>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}