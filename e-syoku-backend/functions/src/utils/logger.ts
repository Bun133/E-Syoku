import {error as fError, info as fInfo, LogEntry, warn as fWarn, write} from "firebase-functions/logger";

export function info(...obj: any) {
    fInfo(obj)
}

export function warn(...obj: any) {
    fWarn(obj)
}

export function error(...obj: any) {
    fError(obj)
}

export function logTrace() {
    console.trace()
}

export function writeLog(entry: LogEntry) {
    write(entry)
}