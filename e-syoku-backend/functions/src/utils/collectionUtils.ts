import {error, warn} from "./logger";
import {ZodType} from "zod";

export {};

export type CollectionUtilOption = {
    toLog?: {
        message: string,
    },
    errorHandling?: (e: Error) => void
}

declare global {
    interface Array<T> {
        filterNotNull(option?: CollectionUtilOption): Array<NonNullable<T>>

        filterInstance<Z>(type: ZodType<Z>, option?: CollectionUtilOption): Array<Z>

        associateWith<V>(f: (x: T) => V): Map<T, V>

        associateWithPromise<V>(f: (x: T) => Promise<V>, option?: CollectionUtilOption): Promise<Map<T, V>>
    }

    interface Map<K, V> {
        toArray(): Array<[K, V]>

        filterValueNotNull(option?: CollectionUtilOption): Map<K, NonNullable<V>>

        filterKeyNotNull(option?: CollectionUtilOption): Map<NonNullable<K>, V>

        filterNotNull(option?: CollectionUtilOption): Map<NonNullable<K>, NonNullable<V>>

        toJson(): Array<{ key: K, value: V }>
    }
}

Array.prototype.filterNotNull = function <T>(option: CollectionUtilOption): Array<NonNullable<T>> {
    let anyNull = false
    const r = this.filter((x) => {
        const b = x !== null && x !== undefined
        if (!b) anyNull = true
        return b
    }) as Array<NonNullable<T>>
    if (anyNull && option.toLog) warn(option.toLog.message)
    return r;
}

Array.prototype.filterInstance = function <Z>(type: ZodType<Z>, option: CollectionUtilOption): Array<Z> {
    return this.filter((x) => {
        const b = type.safeParse(x)
        if (b.success) {
            return b.data
        } else {
            return undefined;
        }
    }).filterNotNull(option) as Array<Z>;
}

Array.prototype.associateWith = function <S, V>(f: (x: S) => V): Map<S, V> {
    const r = new Map<S, V>()
    this.forEach((x) => {
        r.set(x, f(x))
    })
    return r
}

Array.prototype.associateWithPromise = async function <S, V>(f: (x: S) => Promise<V>, option?: CollectionUtilOption): Promise<Map<S, V>> {
    const r = new Map<S, V>()
    const handler = option?.errorHandling || ((e: Error) => {
        error("in AssociateWithPromise, error thrown:", e)
    })
    await Promise.all(this.map(async (x) => {
        const v = await f(x)
        r.set(x, v)
    })).catch(handler)
    return r
}

Map.prototype.toArray = function <K, V>(): Array<[K, V]> {
    return Array.from(this.entries())
}

Map.prototype.filterValueNotNull = function <K, V>(option: CollectionUtilOption): Map<K, NonNullable<V>> {
    let anyNull = false
    const r: [K, NonNullable<V>][] = this.toArray().filter((x: [K, V]) => {
        const b = x[1] !== null && x[1] !== undefined
        if (!b) anyNull = true
        return b
    })
    if (anyNull && option.toLog) warn(option.toLog.message)
    return new Map(r);
}

Map.prototype.filterKeyNotNull = function <K, V>(option: CollectionUtilOption): Map<K, NonNullable<V>> {
    let anyNull = false
    const r: [K, NonNullable<V>][] = this.toArray().filter((x: [K, V]) => {
        const b = x[0] !== null && x[0] !== undefined
        if (!b) anyNull = true
        return b
    })
    if (anyNull && option.toLog) warn(option.toLog.message)
    return new Map(r);
}

Map.prototype.filterNotNull = function <K, V>(option: CollectionUtilOption): Map<K, NonNullable<V>> {
    let anyNull = false
    const r: [K, NonNullable<V>][] = this.toArray().filter((x: [K, V]) => {
        const b = x[1] !== null && x[1] !== undefined && x[0] !== null && x[0] !== undefined
        if (!b) anyNull = true
        return b
    })
    if (anyNull && option.toLog) warn(option.toLog.message)
    return new Map(r);
}

Map.prototype.toJson = function <K, V>(): Array<{ key: K, value: V }> {
    return this.toArray().map((x) => {
        return {
            key: x[0],
            value: x[1]
        }
    })
}