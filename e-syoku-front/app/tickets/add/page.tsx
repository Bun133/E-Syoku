"use client"

import PageTitle from "@/components/pageTitle";
import {ListSelectionPrimitive} from "@/components/form/ListSelection";
import {useState} from "react";
import Btn from "@/components/btn";
import {Heading, HStack, VStack} from "@chakra-ui/layout";

export default function Page() {
    let [firstLetter, setFirstLetter] = useState<string>()
    let [num, setNum] = useState<number>()

    return (
        <div>
            <PageTitle title="食券登録"></PageTitle>
            <VStack>
                <Heading>食券番号を入力してください</Heading>
                <HStack>
                    <ListSelectionPrimitive values={["A", "B", "C"]} selected={(it) => {
                        setFirstLetter(it)
                    }}></ListSelectionPrimitive>
                    <div className="font-bold">
                        -
                    </div>
                    <ListSelectionPrimitive values={[0, 1, 2, 3]} selected={(it) => {
                        setNum(it)
                    }}></ListSelectionPrimitive>
                </HStack>

                <Heading>
                    {firstLetter} - {num}
                </Heading>

                <Btn href={"/tickets/add/" + firstLetter + "-" + num}>
                    登録
                </Btn>
            </VStack>
        </div>
    );
}