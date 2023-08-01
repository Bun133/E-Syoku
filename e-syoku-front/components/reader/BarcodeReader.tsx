import {Flex} from "@chakra-ui/layout";
import {Input, InputGroup} from "@chakra-ui/react";
import {ArrowRight} from "react-feather";
import {useRef, useState} from "react";
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
    const timeout = params.timeout ?? 1000
    const timer = useRef<NodeJS.Timeout>()
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

    function resetTimer() {
        clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            // 時間が切れたので自動で入力扱い
            await onRead()
        }, timeout)
    }

    function updateValue(value: string | undefined) {
        const disabled = value === undefined || value === ""
        if (disabled !== isDisabled) {
            setDisabled(disabled)
        }
        if (str !== value && !disabled) {
            resetTimer()
        }
        setStr(value)
    }

    return (
        <Flex dir={"row"}>
            <InputGroup>
                <Input
                    type="text"
                    placeholder={placeHolderString}
                    onChange={(e) => updateValue(e.target.value)}
                    value={str}
                />
            </InputGroup>

            <Btn onClick={onRead} disabled={isDisabled} autoFocus={params.autoSelect}>
                <ArrowRight color={"white"}/>
            </Btn>
        </Flex>
    )
}