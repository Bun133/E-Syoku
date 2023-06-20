import Button from "@/components/button";
import {Ticket} from "@/lib/e-syoku-api/Types";


export default function TicketComponent(param: { ticket: Ticket }) {
    return (
        <div className="shadow-xl bg-neutral-50 flex flex-row justify-between space-x-1">
            <div className="flex flex-row justify-start items-center space-x-1">
                <div
                    className="text-xl font-bold aspect-square flex items-center justify-center p-1">{param.ticket.ticketNum}</div>
                <div className="flex-col justify-center items-start">
                    {param.ticket.description}
                </div>
            </div>

            <Button href={"/tickets/" + param.ticket.uniqueId}>
                詳しく見る
            </Button>
        </div>
    )
}