import {z} from "zod";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>

import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export const timeStampSchema = z.instanceof(Timestamp);