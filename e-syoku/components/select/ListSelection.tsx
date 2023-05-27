import {ChangeEvent, useState} from "react";

interface Option<T> {
    // name will be shown in select element
    name: string,
    value: T
}

export function ListSelectionPrimitive<T extends string | number>(params: {
    values: T[],
    selected: (t: T) => void
}) {
    return ListSelection({
        values: params.values.map((it) => ({name: it.toString(), value: it})),
        selected: (t) => params.selected(t?.value)
    })
}

export default function ListSelection<T>(params: {
    // T if selected, undefined if not selected
    values: Option<T>[],
    selected: (t: Option<T>) => void
}) {

    let [selected, setSelected] = useState<Option<T>>(params.values[0])

    const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        // find matching value in values
        setSelected(params.values.find((it) => it.name === e.target.value)!!)
        console.log("selected", selected)
        params.selected(selected)
    }

    params.selected(selected)

    return (
        <select onChange={onChange} value={selected?.name}>
            {params.values.map((it, index) => {
                return <option className="m-5" value={it.name} key={index}>{it.name}</option>
            })}
        </select>
    )
}