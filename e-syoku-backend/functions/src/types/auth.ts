import { UserRecord } from "firebase-admin/auth";
import {z} from "zod";
import {uniqueId} from "./types";

const AdminAuth = z.literal("ADMIN")
const ShopAuth = z.literal("SHOP")
const AnonymousAuth = z.literal("ANONYMOUS")
const CashierAuth = z.literal("CASHIER")
export const AuthTypeSchema = z.union([AdminAuth, ShopAuth, AnonymousAuth,CashierAuth])
export type AuthType = z.infer<typeof AuthTypeSchema>

const AdminAuthEntry = z.object({
    authType: AdminAuth,
    uid: uniqueId
})

export type  AdminAuthEntry = z.infer<typeof AdminAuthEntry>

const ShopAuthEntry = z.object({
    authType: ShopAuth,
    uid: uniqueId,
    shopId: uniqueId
})

export type ShopAuthEntry = z.infer<typeof ShopAuthEntry>

const AnonymousAuthEntry = z.object({
    authType: AnonymousAuth,
    uid: uniqueId
})

export type AnonymousAuthEntry = z.infer<typeof AnonymousAuthEntry>

const CashierAuthEntry = z.object({
    authType: CashierAuth,
    uid: uniqueId
})

export type CashierAuthEntry = z.infer<typeof CashierAuthEntry>

export const authEntrySchema = z.union([AdminAuthEntry, ShopAuthEntry, AnonymousAuthEntry,CashierAuthEntry])

/**
 * AuthEntry is the data stored in db.
 * Not use this to check user's permission.
 */
export type AuthEntry = z.infer<typeof authEntrySchema>;
export const authInstanceSchema = authEntrySchema.and(z.object({
    auth: z.instanceof(UserRecord)
}))

/**
 * AuthInstance is the data combined AuthEntry and UserRecord.
 * This instance can be used to check user's permission.
 */
export type AuthInstance = z.infer<typeof authInstanceSchema>