import {Ticket, TicketStatus} from "../types/ticket";
import {createTransport} from "nodemailer";
import {Auth} from "firebase-admin/lib/auth";

export async function sendMailNotification(auth: Auth, changedTicket: Ticket,toStatus:TicketStatus) {
    const user = await auth.getUser(changedTicket.customerId)
    const email = user.email
    if (email) {
        await sendMail(email, changedTicket,toStatus)
    }
}

async function sendMail(toAddress: string, changedTicket: Ticket,toStatus:TicketStatus) {
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
        subject: generateTitle(changedTicket,toStatus),
        text: generateBody(changedTicket,toStatus),
        html: generateHtml(changedTicket,toStatus)
    })
}

function generateTitle(changedTicket: Ticket, toStatus: TicketStatus): string {
    let title = "[モバイルオーダー]"
    switch (toStatus) {
        case "CALLED":
            title += "食券が呼び出されました"
            break
        case "INFORMED":
            title += "お知らせがあります"
            break
        case "PROCESSING":
            title += "注文を承りました"
            break
        case "RESOLVED":
            title += "ご利用ありがとうございました"
            break
    }
    return title
}

function generateBody(changedTicket: Ticket, toStatus: TicketStatus): string {

    switch (toStatus) {
        case "CALLED":
            return `食券番号[${changedTicket.ticketNum}]が呼び出されました。
店舗前までお越しください。`
        case "INFORMED":
            return `お知らせがあります。店舗までお越しください。`
        case "PROCESSING":
            return `注文を承りました。`
        case "RESOLVED":
            return `ご利用ありがとうございました。`
    }
}

function generateHtml(changedTicket: Ticket, toStatus: TicketStatus): string {
    const ticketURL = `https://e-syoku.web.app/tickets/id?id=${changedTicket.uniqueId}`
    switch (toStatus) {
        case "CALLED":
            return `<html lang="ja">
<body>
<p>食券番号[${changedTicket.ticketNum}]が呼び出されました。</p>
<p>店舗前までお越しください。</p>
<p>食券の確認は<a href="${ticketURL}">こちら</a></p>
</body>
</html>`
        case "INFORMED":
            return `お知らせがあります。店舗までお越しください。`
        case "PROCESSING":
            return `<html lang="ja">
<body>
<p>注文を承りました。</p>

<p>食券の確認は<a href="${ticketURL}">こちら</a></p>
</body>
</html>`
        case "RESOLVED":
            return `ご利用ありがとうございました。`
    }
}