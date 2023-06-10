import PageTitle from "@/components/pageTitle";
import Ticket from "@/components/Ticket";

export default function Page() {
    return (
        <div>
            <PageTitle title="食券一覧"></PageTitle>
            <div className="p-2 flex flex-col justify-items-start items-stretch space-y-2">
                <Ticket ticketUniqueId={"JAQze9bOcHT3FsO9djf2"} ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null} isCalled={false}></Ticket>
                <Ticket ticketUniqueId={"test2"} ticketNum={"F-12"} shopName={"Test Shop"} productName={"Test Product"}
                        estimatedTime={null} isCalled={true}></Ticket>
            </div>
        </div>
    )
}