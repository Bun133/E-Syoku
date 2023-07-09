// TSの型チェックを使うためのファンクション

export function injectError(error: ErrorType) {
    return error
}

export type ErrorType = {
    error: string,
    errorCode: string
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

export const internalError: (msg: string) => ErrorType = (msg: string) => {
    return {
        error: msg,
        errorCode: "INTERNAL_ERROR"
    }
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