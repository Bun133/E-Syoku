import Button from "@/app/button";

export default function Home() {
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
