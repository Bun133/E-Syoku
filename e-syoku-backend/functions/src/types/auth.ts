import { UserRecord } from "firebase-admin/auth";
import {z} from "zod";
import {uniqueId} from "./types";

const AdminAuth = z.literal("ADMIN")
const ShopAuth = z.literal("SHOP")
const AnonymousAuth = z.literal("ANONYMOUS")
const AuthType = z.union([AdminAuth, ShopAuth, AnonymousAuth])
export type AuthType = z.infer<typeof AuthType>

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

export const authEntrySchema = AdminAuthEntry.or(ShopAuthEntry).or(AnonymousAuthEntry)

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