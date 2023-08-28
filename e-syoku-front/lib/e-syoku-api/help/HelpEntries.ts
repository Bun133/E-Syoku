export type HelpEntry = {
    mdFileName: string,
    // Help一覧に出すときの表示名(省略すると非表示)
    displayName?: string,
    // 店舗担当者用マニュアル
    isToShop?: boolean,
    // 決済担当者用マニュアル
    isToCashier?: boolean,
    validator: (errorCode: string) => boolean
}

function errorMd(errCode: string): HelpEntry {
    return {
        mdFileName: `${errCode}.md`,
        validator: (errorCode) => errorCode === errCode,
    }
}

function hintMd(mdName: string, displayName: string): HelpEntry {
    return {
        mdFileName: mdName,
        displayName,
        validator: (errorCode) => false,
    }
}

function shopMd(mdName: string, displayName: string): HelpEntry {
    return {
        mdFileName: mdName,
        displayName,
        isToShop: true,
        validator: (errorCode) => false,
    }
}

function cashierMd(mdName: string, displayName: string): HelpEntry {
    return {
        mdFileName: mdName,
        displayName,
        isToCashier: true,
        validator: (errorCode) => false,
    }
}

function unknownMd(): HelpEntry {
    return {
        mdFileName: "unknown.md",
        validator: (errorCode) => true,
    }
}

const helpEntries: HelpEntry[] = [
    errorMd("ITEM_GONE"),
    errorMd("INPUT_WRONG_PAIDAMOUNT"),
    errorMd("INPUT_WRONG_BARCODE"),
    errorMd("TICKET_STATUS_INVALID"),
    errorMd("INTERNAL_BARCODE_BIND_NOT_FOUND"),
    hintMd("HowToOrder.md", "注文方法について"),
    hintMd("HowToCheckTicket.md", "食券を確認したい"),
    hintMd("HowToPay.md", "支払方法について"),
    shopMd("HowToProvideItems.md","商品受け渡しについて"),
    cashierMd("HowToReceiveMoney.md","代金受け取りについて"),
    cashierMd("HowToBindTicket.md","食券の紐づけについて"),
]

export function findHelpEntry(errorCode: string): HelpEntry {
    const err = helpEntries.find(entry => entry.validator(errorCode))
    if (err) {
        return err
    }
    // Fallback to unknown.md
    return unknownMd()
}

export function allHelpEntries(): HelpEntry[] {
    // clone array to prevent mutation
    return [...helpEntries]
}