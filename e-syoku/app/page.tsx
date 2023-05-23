import Button from "@/components/elements/button";

export default function Page() {
    return (
        <div className="flex flex-col justify-start items-center space-y-1 w-full">
            <Button href="/tickets">
                食券一覧
            </Button>
            <Button href="/tickets/add">
                食券登録
            </Button>
        </div>
    )
}
