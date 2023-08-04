import {DBRefs, mergeData, parseData} from "../utils/db";
import {Result} from "../types/errors";
import {MessageTokenData, messageTokenDataSchema} from "../types/notification";
import {Messaging, MulticastMessage} from "firebase-admin/lib/messaging";

export async function getMessageTokenData(refs: DBRefs, uid: string): Promise<MessageTokenData | undefined> {
    return parseData(messageTokenDataSchema, refs.messageTokens(uid), (data) => {
        return {
            uid: uid,
            registeredTokens: data.registeredTokens
        }
    })
}

export async function addMessageToken(refs: DBRefs, uid: string, toAddToken: string[]): Promise<Result> {
    const data = await getMessageTokenData(refs, uid)
    let toMerge: MessageTokenData
    if (data) {
        toMerge = {
            uid: uid,
            registeredTokens: [...data.registeredTokens, ...toAddToken]
        }
    } else {
        toMerge = {
            uid: uid,
            registeredTokens: toAddToken
        }
    }

    return mergeData(messageTokenDataSchema, refs.messageTokens(uid), toMerge)
}

function multicastMessageBuilder(data: {
    tokens: string[],
    body: string,
    title: string,
    imageUrl?: string
}): MulticastMessage {
    return {
        tokens: data.tokens,
        data: {},
        notification: {
            body: data.body,
            title: data.title,
            imageUrl: data.imageUrl
        }
    }
}

export type NotificationData = {
    body: string,
    title: string,
    imageUrl?: string
}

export async function sendMessage(refs: DBRefs, messaging: Messaging, uid: string, notificationData: NotificationData) {
    const data = await getMessageTokenData(refs, uid)
    if (!data) {
        return
    }

    const multicastMessage = multicastMessageBuilder({
        tokens: data.registeredTokens,
        body: notificationData.body,
        title: notificationData.title,
        imageUrl: notificationData.imageUrl
    })

    await messaging.sendEachForMulticast(multicastMessage)
}