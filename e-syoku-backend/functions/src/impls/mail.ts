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
    await createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    }).sendMail({
        from: "noreply@e-syoku.com",
        to: toAddress,
        subject: "TITLE",
        text: "TEST: " + JSON.stringify(changedTicket),
    })
}