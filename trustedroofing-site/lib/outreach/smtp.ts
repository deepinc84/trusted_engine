import nodemailer from "nodemailer";

export async function sendOutreachEmail(input: { to: string; subject: string; text: string; html: string }) {
  const host = process.env.OUTREACH_SMTP_HOST;
  const port = Number(process.env.OUTREACH_SMTP_PORT ?? 465);
  const secure = String(process.env.OUTREACH_SMTP_SECURE ?? "true") === "true";
  const user = process.env.OUTREACH_SMTP_USER;
  const pass = process.env.OUTREACH_SMTP_PASSWORD;
  const fromEmail = process.env.OUTREACH_FROM_EMAIL;
  const fromName = process.env.OUTREACH_FROM_NAME ?? "Trusted Exteriors SEO";

  if (!host || !user || !pass || !fromEmail) {
    throw new Error("Outreach SMTP environment is incomplete");
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  const result = await transporter.sendMail({
    from: `"${fromName.replace(/"/g, "")}" <${fromEmail}>`,
    to: input.to,
    replyTo: fromEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return String(result.messageId ?? "");
}
