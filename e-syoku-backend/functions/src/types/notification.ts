import {z} from 'zod';
import {uniqueId} from "./types";

export const messageTokenDataSchema = z.object({
    uid: uniqueId,
    registeredTokens: z.array(z.string()),
})

export type MessageTokenData = z.infer<typeof messageTokenDataSchema>