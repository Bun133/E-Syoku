export function StringInput(param: {
    onChange: (current: string) => void,
    placeholder?: string
}) {
    return (
        <input type="text" onChange={(e) => {
            param.onChange(e.target.value)
        }} placeholder={param.placeholder}
               className={"border-2 border-gray-300"}
        />
    )
}