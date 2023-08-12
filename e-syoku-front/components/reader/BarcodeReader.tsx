import {Flex} from "@chakra-ui/layout";
import {Input, InputGroup} from "@chakra-ui/react";
import {ArrowRight} from "react-feather";
import {useState} from "react";
import Btn from "@/components/btn";


export function BarcodeReader(params: {
    onRead: (read: string) => void | Promise<void>,
    placeholder?: string,
    autoSelect: boolean,
    timeout?: number,
    autoClear?: boolean
}) {
    const placeHolderString = params.placeholder ?? "バーコード読み取り"
    const [str, setStr] = useState<string>()
    const [isDisabled, setDisabled] = useState(true)
    const toClear = params.autoClear ?? true


    async function onRead() {
        if (str !== undefined) {
            setDisabled(true)
            await params.onRead(str)
            if (toClear) {
                setStr("")
            }
            setDisabled(false)
        }
    }

    function updateValue(value: string | undefined) {
        const disabled = value === undefined || value === ""
        if (disabled !== isDisabled) {
            setDisabled(disabled)
        }
        setStr(value)
    }

    function onEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !isDisabled) {
            onRead()
        }
    }

    return (
        <Flex dir={"row"}>
            <InputGroup>
                <Input
                    type="text"
                    placeholder={placeHolderString}
                    onChange={(e) => updateValue(e.target.value)}
                    value={str}
                    autoFocus={params.autoSelect}
                    onKeyDown={onEnterKey}
                />
            </InputGroup>

            <Btn onClick={onRead} disabled={isDisabled}>
                <ArrowRight color={"white"}/>
            </Btn>
        </Flex>
    )
}