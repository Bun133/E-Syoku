import { Timestamp } from "firebase-admin/firestore";
import {z} from "zod";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>

export const timeStampSchema = z.instanceof(Timestamp);