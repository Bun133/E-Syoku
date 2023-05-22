import PageTitle from "@/app/pageTitle";
import Ticket from "@/app/tickets/Ticket";

export default function Home() {
    return (
        <div>
            <PageTitle title="食券一覧"></PageTitle>
            <div className="p-2 flex flex-col justify-items-start items-stretch space-y-2">
                <Ticket ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null}></Ticket>
                <Ticket ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null}></Ticket>
            </div>
        </div>
    )
}