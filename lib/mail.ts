import nodemailer, { type Transporter } from "nodemailer";

/**
 * Письма сайта (сейчас — только коды восстановления пароля). SMTP задаётся переменными:
 * SMTP_HOST, SMTP_PORT (465 — SSL, 587 — STARTTLS), SMTP_USER, SMTP_PASS, MAIL_FROM.
 * Без SMTP_HOST при разработке письмо печатается в консоль сервера.
 */
export const mailConfigured = () => Boolean(process.env.SMTP_HOST) || process.env.NODE_ENV !== "production";

// Без пула: соединение открывается на одно письмо — писем мало, держать его открытым незачем
let transporter: Transporter | null = null;
function transport() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[почта не настроена — письмо для ${to}] ${subject}\n${text}`);
    return;
  }
  await transport().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}
