import {Flex} from "@chakra-ui/layout";
import {Input, InputGroup} from "@chakra-ui/react";
import {ArrowRight} from "react-feather";
import {useRef, useState} from "react";
import Btn from "@/components/btn";


export function BarcodeReader(params: {
    onRead: (read: string) => void | Promise<void>,
    placeholder?: string,
    autoSelect: boolean
}) {
    const placeHolderString = params.placeholder ?? "バーコード読み取り"
    const str = useRef<string>()
    const [isDisabled, setDisabled] = useState(true)

    function updateValue(value: string | undefined) {
        str.current = value
        const disabled = value === undefined || value === ""
        if (disabled !== isDisabled) {
            setDisabled(disabled)
        }
    }

    return (
        <Flex dir={"row"}>
            <InputGroup>
                <Input
                    type="text"
                    placeholder={placeHolderString}
                    onChange={(e) => updateValue(e.target.value)}
                />
            </InputGroup>

            <Btn onClick={async () => {
                if (str.current !== undefined) {
                    await params.onRead(str.current)
                }
            }} disabled={isDisabled} autoFocus={params.autoSelect}>
                <ArrowRight color={"white"}/>
            </Btn>
        </Flex>
    )
}