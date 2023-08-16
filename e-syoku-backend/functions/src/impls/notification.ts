import {DBRefs, mergeData, parseData} from "../utils/db";
import {SingleResult, Success, TypedSingleResult} from "../types/errors";
import {MessageTokenData, messageTokenDataSchema} from "../types/notification";
import {Messaging, MulticastMessage} from "firebase-admin/lib/messaging";
import {dbNotFoundError, isSingleError, isTypedSuccess} from "./errors";

export async function getMessageTokenData(refs: DBRefs, uid: string): Promise<TypedSingleResult<MessageTokenData>> {
    return parseData(dbNotFoundError("messageTokenData"), messageTokenDataSchema, refs.messageTokens(uid), (data) => {
        return {
            uid: uid,
            registeredTokens: data.registeredTokens
        }
    })
}

export async function addMessageToken(refs: DBRefs, uid: string, toAddToken: string[]): Promise<SingleResult> {
    const data = await getMessageTokenData(refs, uid)
    let toMerge: MessageTokenData
    if (isTypedSuccess(data)) {
        toMerge = {
            uid: uid,
            // Distinct
            registeredTokens: Array.from(new Set([...data.data.registeredTokens, ...toAddToken]))
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
    imageUrl?: string,
    clickUrl?: string
}): MulticastMessage {
    if (data.clickUrl) {
        return {
            tokens: data.tokens,
            data: {
                pathname: data.clickUrl
            },
            android: {
                notification: {
                    clickAction: data.clickUrl,
                }
            },
            apns: {
                fcmOptions: {
                    imageUrl: data.imageUrl
                },
                payload: {
                    aps: {}
                }
            },
            notification: {
                body: data.body,
                title: data.title,
                imageUrl: data.imageUrl,
            }
        }
    }
    return {
        tokens: data.tokens,
        data: {},
        notification: {
            body: data.body,
            title: data.title,
            imageUrl: data.imageUrl,
        }
    }
}

export type NotificationData = {
    body: string,
    title: string,
    imageUrl?: string,
    clickUrl?: string
}

// TODO Result Type
export async function sendMessage(refs: DBRefs, messaging: Messaging, uid: string, notificationData: NotificationData): Promise<SingleResult> {
    const data = await getMessageTokenData(refs, uid)
    if (isSingleError(data)) {
        return data
    }

    const multicastMessage = multicastMessageBuilder({
        tokens: data.data.registeredTokens,
        body: notificationData.body,
        title: notificationData.title,
        imageUrl: notificationData.imageUrl,
        clickUrl: notificationData.clickUrl
    })

    await messaging.sendEachForMulticast(multicastMessage)

    const suc: Success = {
        isSuccess: true,
    }

    return suc
}