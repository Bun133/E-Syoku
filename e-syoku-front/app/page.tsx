import Button from "@/components/button";

export default function Page() {
    return (
        <div className="flex flex-col justify-start items-center space-y-1 w-full">
            <Button href="/tickets">
                食券一覧
            </Button>
            <Button href="/tickets/add">
                食券登録(クライアント側)
            </Button>
            <Button href="/shopui/tickets/register">
                食券登録(店舗側)
            </Button>
        </div>
    )
}
