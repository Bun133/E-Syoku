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
import React from "react";

export function MessageModal(param: {
    message: React.ReactNode[],
    isOpen: boolean,
    onClose: () => void
}) {
    return (
        <>
            <Modal isOpen={param.isOpen} onClose={param.onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Message</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                        {param.message.map((m, i) => m)}
                    </ModalBody>

                    <ModalFooter>
                        <Btn onClick={param.onClose}>閉じる</Btn>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}