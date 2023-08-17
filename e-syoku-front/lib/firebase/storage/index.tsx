"use client"

import {getBlob, getStorage, ref} from "@firebase/storage";
import {firebaseApp} from "@/lib/firebase";
import {useEffect, useState} from "react";
import {Center} from "@chakra-ui/layout";
import {Spinner} from "@chakra-ui/react";
import {AlertOctagon} from "react-feather";

export function StorageImage(props: {
    storagePath: string,
    alt?: string
}) {
    const str = getStorage(firebaseApp)

    const [blob, setBlob] = useState<Blob>()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function body(): Promise<Blob> {
            const r = ref(str, props.storagePath)
            setIsLoading(true)
            return await getBlob(r)
        }

        body().then(b => {
            setBlob(b)
        }).catch(e => {
            console.error(e)
        }).finally(() => {
            setIsLoading(false)
        })
    }, [props.storagePath]);

    if (isLoading) {
        return (
            <Center>
                <Spinner/>
            </Center>
        )
    }

    if (!blob) {
        return (
            <Center>
                <AlertOctagon color={"red"}/>
            </Center>
        )
    }

    return (<img src={URL.createObjectURL(blob)} alt={props.alt}/>)
}