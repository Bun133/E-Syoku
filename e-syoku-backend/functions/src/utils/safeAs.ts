import {z, ZodType} from "zod";

export function safeAs<T>(type: ZodType<T>, value: any): T | undefined {
    try {
        return type.parse(value);
    } catch (e) {
        console.log("ERROR", e)
        return undefined
    }
}

const zString = z.string()

export function safeAsString(value: any) {
    return safeAs(zString, value)
}