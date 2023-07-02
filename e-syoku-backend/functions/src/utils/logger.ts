import {error as fError, info as fInfo, warn as fWarn} from "firebase-functions/logger";

export function info(...obj: any) {
    fInfo(obj)
}

export function warn(...obj: any) {
    fWarn(obj)
}

export function error(...obj: any) {
    fError(obj)
}
