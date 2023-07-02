import Btn from "@/components/btn";
import {Ticket} from "@/lib/e-syoku-api/Types";
import {ReactNode} from "react";


export default function TicketComponent(param: {
    ticket: Ticket,
    button?: ReactNode
}) {
    const button = param.button !== undefined ?
        param.button :
        (<Btn href={"/tickets/" + param.ticket.uniqueId}>
            詳しく見る
        </Btn>);


    return (
        <div className="shadow-xl bg-neutral-50 flex flex-row justify-between space-x-1 items-center">
            <div className="flex flex-row justify-start items-center space-x-1">
                <div
                    className="text-xl font-bold aspect-square flex items-center justify-center p-1">{param.ticket.ticketNum}</div>
                <div className="flex-col justify-center items-start">
                    {param.ticket.description}
                </div>
            </div>

            <div className={"py-1 px-1 flex flex-row items-center"}>
                {param.ticket.status}
                <div className={"w-2"}></div>
                {button}
            </div>
        </div>
    )
}