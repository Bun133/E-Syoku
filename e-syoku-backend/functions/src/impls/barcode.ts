import {DBRefs, parseData, setData} from "../utils/db";
import {Result} from "../types/errors";
import {BarcodeBindData, barcodeBindDataSchema} from "../types/barcode";

export async function getBarcodeBindData(ref: DBRefs, barcode: number): Promise<undefined | BarcodeBindData> {
    return parseData(barcodeBindDataSchema, ref.binds(barcode), (data) => {
        return {
            barcode: barcode,
            ticketId: data.ticketId
        }
    })
}

/**
 * バーコードと食券IDを紐づけます
 * @param ref
 * @param barcode
 * @param ticketId
 */
export async function setBarcodeBindData(ref: DBRefs, barcode: number, ticketId: string): Promise<Result> {
    return setData(barcodeBindDataSchema.omit({barcode: true}), ref.binds(barcode), {
        ticketId: ticketId
    })
}