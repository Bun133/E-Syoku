import {Timestamp} from "firebase-admin/firestore";
import {z} from "zod";
import {firestore} from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>

export const timeStampSchema = z.instanceof(Timestamp);
export const firestoreRefSchema = z.object({}).refine((obj)=>{
    return obj instanceof DocumentReference;
})