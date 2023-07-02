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
            <Button href="/shopui/tickets/call">
                食券呼び出し(店舗側)
            </Button>
            <Button href="/order/">
                メニュー
            </Button>
        </div>
    )
}
