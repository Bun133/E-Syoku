import {DBRefs, parseData, parseDataAll} from "../utils/db";
import {listAllShop} from "./shop";
import {Error, Success, TypedSingleResult} from "../types/errors";
import {barcodeMatchTooMuch, barcodeNotMatch, injectError, dbNotFoundError} from "./errors";
import {BarcodeInfo, barcodeInfoSchema} from "../types/barcodeInfos";

export async function getBarcodeInfo(refs: DBRefs, shopId: string): Promise<TypedSingleResult<BarcodeInfo>> {
    return await parseData<BarcodeInfo>(dbNotFoundError("barcodeInfo"),barcodeInfoSchema, refs.barcodeInfos(shopId), (data) => {
        return {
            shopId: shopId,
            barcodeStartsWith: data.barcodeStartsWith
        }
    })
}

export async function allBarcodeInfos(refs: DBRefs): Promise<BarcodeInfo[]> {
    const shopIds = await listAllShop(refs)
    const barcodeRefs = shopIds.map(d => refs.barcodeInfos(d.shopId))
    return await parseDataAll<BarcodeInfo>(barcodeInfoSchema, barcodeRefs, (ref, data) => {
        return {
            // TODO 安全ではない気が・・・
            shopId: ref.parent.parent!!.id,
            barcodeStartsWith: data.barcodeStartsWith
        }
    })
}

function isBarcodeMatch(info: BarcodeInfo, barcode: string): boolean {
    return info.barcodeStartsWith.some(d => barcode.startsWith(d))
}

/**
 * 渡されたバーコードがどの店舗の物であるか判断します
 * 条件に合致する店舗が複数ある場合にはエラーとします
 */
export async function judgeBarcode(refs: DBRefs, barcode: string): Promise<Success & {
    info: BarcodeInfo
} | Error> {
    const allInfos = await allBarcodeInfos(refs)
    const matches = allInfos.filter(d => isBarcodeMatch(d, barcode))
    if (matches.length === 0) {
        const err: Error = {
            isSuccess: false,
            ...injectError(barcodeNotMatch)
        }
        return err
    } else if (matches.length === 1) {
        const suc: Success & {
            info: BarcodeInfo
        } = {
            isSuccess: true,
            info: matches[0]
        }
        return suc
    } else {
        const err: Error = {
            isSuccess: false,
            ...injectError(barcodeMatchTooMuch)
        }
        return err
    }
}