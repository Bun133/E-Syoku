import PageTitle from "@/components/elements/pageTitle";
import Ticket from "@/components/elements/Ticket";

export default function Page() {
    return (
        <div>
            <PageTitle title="食券一覧"></PageTitle>
            <div className="p-2 flex flex-col justify-items-start items-stretch space-y-2">
                <Ticket ticketUniqueId={"test1"} ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null} isCalled={false}></Ticket>
                <Ticket ticketUniqueId={"test2"} ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null} isCalled={true}></Ticket>
            </div>
        </div>
    )
}