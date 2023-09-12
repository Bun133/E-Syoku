import {Ticket} from "../types/ticket";
import {createTransport} from "nodemailer";
import {Auth} from "firebase-admin/lib/auth";

export async function sendMailNotification(auth: Auth, changedTicket: Ticket) {
    const user = await auth.getUser(changedTicket.customerId)
    const email = user.email
    if (email) {
        await sendMail(email, changedTicket)
    }
}

async function sendMail(toAddress: string, changedTicket: Ticket) {
    // TODO sendGridのSMTPをここにかく
    await createTransport().sendMail({
        from: "noreply@e-syoku.web.app",
        to: toAddress,
        subject: "TITLE",
        text: "TEST: " + JSON.stringify(changedTicket),
    })
}