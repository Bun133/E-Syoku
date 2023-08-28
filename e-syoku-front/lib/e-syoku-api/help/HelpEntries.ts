export type HelpEntry = {
    mdFileName: string,
    validator: (errorCode: string) => boolean
}

function errorMd(errCode: string): HelpEntry {
    return {
        mdFileName: `${errCode}.md`,
        validator: (errorCode) => errorCode === errCode,
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