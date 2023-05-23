import PageTitle from "@/app/pageTitle";

export default function Page() {
    return (
        <div>
            <PageTitle title="食券登録"></PageTitle>
            <div className="flex flex-col items-center justify-start space-y-1">
                <h1>食券番号を入力してください</h1>
            </div>
        </div>
    );
}