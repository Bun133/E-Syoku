export type HelpEntry = {
    mdFileName: string,
    // Help一覧に出すときの表示名(省略すると非表示)
    displayName?: string,
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
    hintMd("HowToOrder.md", "注文方法について"),
    hintMd("HowToCheckTicket.md", "食券を確認したい"),
    hintMd("HowToPay.md", "支払方法について"),
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