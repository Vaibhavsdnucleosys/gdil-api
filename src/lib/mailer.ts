
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendFormNotification(options: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  if (!process.env.SMTP_FROM) {
    throw new Error("SMTP_FROM is not configured.");
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });
}
