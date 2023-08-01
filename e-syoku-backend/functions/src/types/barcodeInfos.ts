import {z} from "zod";
import {uniqueId} from "./types";
import {DBRefs, parseData, parseDataAll} from "../utils/db";
import {Error, Success} from "./errors";
import {listAllShop} from "../impls/shop";
import {barcodeMatchTooMuch, barcodeNotMatch, injectError} from "../impls/errors";

/**
 * 特定店舗で使用される食券のバーコードについての情報
 * この情報をもとに紙の食券とチケットを紐づける
 */
export const barcodeInfoSchema = z.object({
    shopId: uniqueId,
    // バーコードの頭
    barcodeStartsWith: z.string().array().nonempty(),
})

export type BarcodeInfo = z.infer<typeof barcodeInfoSchema>

export async function getBarcodeInfo(refs: DBRefs, shopId: string): Promise<BarcodeInfo | undefined> {
    return await parseData<BarcodeInfo>(barcodeInfoSchema, refs.barcodeInfos(shopId), (data) => {
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
            shopId: ref.id,
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