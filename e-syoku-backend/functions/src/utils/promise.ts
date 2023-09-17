export async function promiseInRow<I, R>(inputs: I[], f: (i: I) => Promise<R>): Promise<R[]> {
    let r: R[] = []
    for (const i of inputs) {
        r.push(await f(i))
    }
    return r
}