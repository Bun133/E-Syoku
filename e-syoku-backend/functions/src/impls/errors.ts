// TSの型チェックを使うためのファンクション

import {
    Error,
    Result,
    SingleError,
    SingleResult,
    Success,
    TypedResult,
    TypedSingleResult,
    TypedSuccess
} from "../types/errors";

export function injectError(error: ErrorType) {
    return error
}

export type ErrorType = {
    error: string,
    errorCode: string
}

type ErrorLike = SingleError | Error

export function errorResult(leadingError: SingleError, ...childErrors: ErrorLike[]): Error {
    const errors: SingleError[] = []

    for (const error of childErrors) {
        if (typeof error.error === "string") {
            errors.push(error as SingleError)
        } else {
            errors.push((error as Error).error)
            errors.push(...(error as Error).errors)
        }
    }

    return {
        isSuccess: false,
        error: leadingError,
        errors: errors
    }
}

export function isSingleError(res: SingleResult | TypedSingleResult<any>): res is SingleError {
    return !res.isSuccess
}

export function isError(res: Result | TypedResult<any>): res is Error {
    return !res.isSuccess
}

export function isSuccess(res: Result | SingleResult): res is Success {
    return res.isSuccess
}

export function isTypedSuccess<R>(res: TypedResult<R> | TypedSingleResult<R>): res is TypedSuccess<R> {
    return res.isSuccess
}

/**
 * 起きてはならないエラー、起こしてはならないエラー、構造的にあり得ない条件などに出くわしたときに使用
 * @param msg
 * @param errorCode
 */
const internalError: (msg: string, errorCode: string) => ErrorType = (msg: string, errorCode: string) => {
    return {
        error: msg,
        errorCode: `INTERNAL_${errorCode}`
    }
}

const cmsError: (msg: string, errorCode: string) => ErrorType = (msg: string, errorCode: string) => {
    return {
        error: msg,
        errorCode: `CMS_${errorCode}`
    }
}

// DB内にデータが見つからない
export const dbNotFoundError = (dataName: string) => {
    const upperCase = dataName.toUpperCase()
    return internalError(`${dataName}が見つかりませんでした`, `NOT_FOUND_IN_DB_${upperCase}`)
}

// 入力値の変更がない限り、当該メソッドが成功する見込みがないエラー
export const inputWrongError: (inputName: string, hint: string) => ErrorType = (inputName: string, hint: string) => {
    return {
        error: hint,
        errorCode: `INPUT_WRONG_${inputName.toUpperCase()}`
    }
}

export const authFailedError: ErrorType = {
    error: "認証に失敗しました",
    errorCode: "AUTH_FAILED"
}

export const internalAuthFailedError: ErrorType = internalError("認証に失敗しました", "AUTH_FAILED")

export const ticketNotFoundError: ErrorType = inputWrongError("TicketId", "指定されたチケットが見つかりません")

export const paymentNotFoundError: ErrorType = inputWrongError("PaymentSession", "指定された決済セッションが見つかりません")

export const paymentCreateFailedError = internalError("決済セッションの作成に失敗しました", "PAYMENT_CREATE_FAILED")

export const paymentStatusNotSatisfiedError: ErrorType = {
    error:"指定された決済セッションは無効です",
    errorCode:"PAYMENT_NOT_SATISFY"
}

export const itemGoneError: (missedItemsId: string[]) => ErrorType = (ids: string[]) => {
    return {
        error: "一部の商品の在庫がなくなりました",
        errorCode: "ITEM_GONE",
        missedItems: ids
    }
}

export const calculateTotalAmountFailed: ErrorType = {
    error: "商品データの取得に失敗しました",
    errorCode: "CALCULATE_TOTAL_AMOUNT_FAILED"
}

export const ticketStatusInvalidError: (assumed: string, actual: string) => ErrorType = (assumed: string, actual: string) => {
    return {
        error: `指定されたチケットの現在の状態が前提条件に合致しません(想定: ${assumed},実際: ${actual})`,
        errorCode: "TICKET_STATUS_INVALID",
        assumed: assumed,
        actual: actual
    }
}

export const paidWrongAmountError: ErrorType = inputWrongError("PaidAmount", "決済済み金額が決済セッションの合計金額と合致しません")

export const alreadyPaidError: ErrorType = {
    error: "すでに決済が完了している決済セッションです",
    errorCode: "ALREADY_PAID"
}

export const failedToGetItemDataError: ErrorType = {
    error: "商品データの取得に失敗しました",
    errorCode: "FAILED_TO_GET_ITEM_DATA",
}

export const remainDataTypeNotKnownError: ErrorType = internalError("RemainDataの型が既知の物と合致しません", "REMAIN_DATA_TYPE_NOT_KNOWN")

export const remainStatusNegativeError: ErrorType = internalError("RemainStatusのremainCountが負の値になりました", "REMAIN_STATUS_NEGATIVE")
export const deltaNegativeError: ErrorType = internalError("変化量が負の値になりました", "DELTA_NEGATIVE")

export const updateDataFailedError = internalError("Updateの際にエラーが発生したため、Update出来ませんでした", "UPDATE_DATA_FAILED")
export const setDataFailedError = internalError("SETの際にエラーが発生したため、Update出来ませんでした", "SET_DATA_FAILED")

export const mergeDataFailedError = internalError("Mergeの際にエラーが発生したため、Merge出来ませんでした", "MERGE_DATA_FAILED")

export const createDataFailedError = internalError("Createの際にエラーが発生したため、Create出来ませんでした", "CREATE_DATA_FAILED")


export const requestNotContainUserIdError = inputWrongError("TargetUID", "リクエストにUIDが含まれていない/指定されていません")

export const ticketNumGenerateFailedError = internalError("次のTicketNumの生成に失敗しました", "TICKETNUM_GENERATE_FAILED")

export const permissionDataMissing = inputWrongError("権限データ", "権限データの一部がかけています")

export const authTypeInvalidError = inputWrongError("AuthType", "AuthTypeが適切ではありません")
export const ticketNotSpecifiedError = inputWrongError("TicketSpecifyData", "このデータではチケットを特定できません")

export const internalErrorThrownError = internalError("内部でエラーが発生しました", "INTERNAL_ERROR_THROWN")

export const failedToRegisterTicketError = internalError("チケットの登録に失敗しました", "REGISTER_TICKET_FAILED")

export const barcodeNotMatch = inputWrongError("BARCODE", "バーコードが合致しません")

export const barcodeMatchTooMuch = inputWrongError("BARCODE", "バーコードが複数に合致します")

export const barcodeBindDataNotFound = internalError("バーコード紐づけ情報が存在しません","BARCODE_BIND_NOT_FOUND")

export const cmsTicketNotSatisfyCondition = cmsError("指定条件が緩すぎます", "TICKET_NOT_SATISFY_CONDITION")

export const parseDataZodFailed = internalError(`正常にデータを処理できませんでした`, `PARSE_DATA_FAILED_ZOD`)

export const parseDataNotFound = internalError(`データが見つかりませんでした`, `PARSE_DATA_FAILED_NOT_FOUND`)

export const prettyOrderFailed = internalError("OrderデータをPretty化できませんでした", "PRETTY_ORDER_FAILED")

export const dummyError = internalError("Dummy", "DUMMY_ERROR")

export const paymentIdNotFoundError = inputWrongError("PaymentId|Barcode", "決済データが指定されていません")

export const prettyTicketFailed = internalError("TicketデータをPretty化に失敗しました", "PRETTY_TICKET_FAILED")