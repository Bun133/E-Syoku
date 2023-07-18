"use client"

import PageTitle from "@/components/pageTitle";
import {useSearchParams} from "next/navigation";
import {callTicketEndPoint} from "@/lib/e-syoku-api/EndPoints";
import React from "react";
import {APIEndpoint} from "@/lib/e-syoku-api/APIEndpointComponent";
import {useFirebaseAuth} from "@/lib/firebase/authentication";

export default function Page() {
    const params = useSearchParams()
    const id = params.get("id") ?? undefined
    const auth = useFirebaseAuth()

    return (
        <>
            <PageTitle title={"食券呼び出し"}></PageTitle>
            <APIEndpoint endpoint={callTicketEndPoint} query={{ticketId: id, uid: auth.user?.uid}}
                         onEnd={(response, reload) => {
                             return (
                                 <>
                                     <PageTitle title={"食券呼び出し"}></PageTitle>
                                     <div className={"flex flex-col items-center justify-center"}>
                                         呼び出しました!
                                     </div>
                                 </>
                             )
                         }}/>
        </>
    )
}