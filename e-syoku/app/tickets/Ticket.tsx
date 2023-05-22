export default function Ticket(param: {
    ticketNum: string,
    shopName: string,
    productName: string | null,
    estimatedTime: Date | null
}) {
    return (
        <div className="shadow-xl bg-neutral-50 flex flex-row justify-between space-x-1">
            <div className="flex flex-row justify-start items-center space-x-1">
                <div className="text-xl font-bold aspect-square flex items-center justify-center p-1">{param.ticketNum}</div>
                <div className="flex-col justify-center items-start">
                    {param.shopName}
                    {param.productName && <div className="text-sm">{param.productName}</div>}
                    {param.estimatedTime &&
                        <div className="text-sm">Estimated Time: {param.estimatedTime.toLocaleString()}</div>}
                </div>
            </div>

            <button className="p-2 bg-green-400 rounded-xl m-2">
                詳しく見る
            </button>
        </div>
    )
}