import {z} from "zod";
import {uniqueId} from "./types";

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