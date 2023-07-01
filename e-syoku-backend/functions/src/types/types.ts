import {z} from "zod";
import {firestore} from "firebase-admin";

/**
 * Unique ID Type, used for identifying items in the database.
 */
export const uniqueId = z.string();

export type UniqueId = z.infer<typeof uniqueId>

import Timestamp = firestore.Timestamp;

export const timeStampSchema = z.instanceof(Timestamp, {message: "Type is not TimeStamp"});