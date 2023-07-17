// TSの型チェックを使うためのファンクション

import {MultipleError, SingleError} from "../types/errors";

export function injectError(error: ErrorType) {
    return error
}

export type ErrorType = {
    error: string,
    errorCode: string
}

export type RepresentativeErrorType = (errors: SingleError[]) => MultipleError

function representativeError(error: ErrorType): RepresentativeErrorType {
    return (errors: SingleError[]) => {
        const r: MultipleError = {
            isSuccess: false,
            error: {
                isSuccess: false,
                ...injectError(error)
            },
            errors: errors
        }
        return r
    }
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

export const authFailedError: ErrorType = {
    error: "認証に失敗しました",
    errorCode: "AUTH_FAILED"
}

export const ticketNotFoundError: ErrorType = {
    error: "指定されたチケットが見つかりません",
    errorCode: "TICKET_NOT_FOUND"
}

export const paymentNotFoundError: ErrorType = {
    error: "指定された決済セッションが見つかりません",
    errorCode: "PAYMENT_NOT_FOUND"
}

export const itemGoneError: (missedItemsId: string[]) => ErrorType = (ids: string[]) => {
    return {
        error: "一部の商品の在庫がなくなりました",
        errorCode: "ITEM_GONE",
        missedItems: ids
    }
}

export const calculateTotalAmountFailed: ErrorType = {
    error: "商品データの取得に失敗しました。処理を中断します",
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

export const failedToUpdateTicket: ErrorType = {
    error: "チケット情報の更新に失敗しました",
    errorCode: "FAILED_TO_UPDATE_TICKET"
}

export const paidWrongAmountError: ErrorType = {
    error: "決済金額が決済セッションの合計金額と合致しません",
    errorCode: "PAID_WRONG_AMOUNT"
}

export const alreadyPaidError: ErrorType = {
    error: "すでに決済が完了している決済セッションです",
    errorCode: "ALREADY_PAID"
}

export const failedToGetItemDataError: ErrorType = {
    error: "商品データの取得に失敗しました",
    errorCode: "FAILED_TO_GET_ITEM_DATA",
}

export const remainDataTypeNotKnownError: ErrorType = internalError("RemainDataの型が既知の物と合致しません", "REMAIN_DATA_TYPE_NOT_KNOWN")

export const remainStatusConflictedError = internalError("見つかるはずのRemainDataが見つかりませんでした", "REMAIN_STATUS_CONFLICTED")

export const remainDataCalculateFailedError = representativeError({
    error: "いくつかの商品の在庫数を計算出来ませんでした",
    errorCode: "REMAIN_DATA_CALCULATE_FAILED"
})
export const remainStatusNegativeError: ErrorType = internalError("RemainStatusのremainCountが負の値になりました", "REMAIN_STATUS_NEGATIVE")

export const updateDataFailedError = internalError("Updateの際にエラーが発生したため、Update出来ませんでした", "UPDATE_DATA_FAILED")
export const setDataFailedError = internalError("SETの際にエラーが発生したため、Update出来ませんでした", "SET_DATA_FAILED")

// export const updateStrictTypeNotMatchError = internalError("Updateの際に型が合っていないため、Update処理できない", "UPDATE_STRICT_TYPE_NOT_MATCH")

export const updateRemainDataFailedError = representativeError({
    error: "RemainDataの更新処理に失敗しました",
    errorCode: "UPDATE_REMAIN_DATA_FAILED"
})

export const requestNotContainUserIdError = internalError("リクエストにUIDが含まれていない/指定されていません", "REQUEST_NOT_CONTAIN_USER_ID")

export const transactionFailedError = internalError("Transactionの処理に失敗しました", "TRANSACTION_FAILED")

export const ticketNumInfoNotFound = internalError("TicketNumInfoの取得に失敗しました", "TICKETNUM_INFO_NOT_FOUND")

export const ticketNumGenerateFailedError = internalError("次のTicketNumの生成に失敗しました", "TICKETNUM_GENERATE_FAILED")