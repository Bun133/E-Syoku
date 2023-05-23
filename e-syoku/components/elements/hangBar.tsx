export function HangBar() {
    return (
        <div className="flex flex-row justify-between items-center h-16 w-full bg-blue-300">
            <div className="pl-2 flex flex-row justify-between items-center space-x-2">
                {/* TODO アイコン差し替え */}
                <img src="/next.svg" alt="next" className="h-8 w-8"/>
                <button>A</button>
                <button>B</button>
            </div>
            <div className="pr-3 flex flex-row justify-between items-center space-x-2">
                <a className="text" href="https://github.com/Bun133/E-Syoku" target="_blank">Powered By E-Syoku</a>
            </div>
        </div>
    );
}