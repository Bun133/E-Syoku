import {z} from "zod";
import {firestore} from "firebase-admin";
import Timestamp = firestore.Timestamp;

export const timeStampSchema = z.instanceof(Timestamp);