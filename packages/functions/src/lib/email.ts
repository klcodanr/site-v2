import { Resource } from "sst";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPConnection from "nodemailer/lib/smtp-connection";

export type EmailMessage = {
    from: string;
    to: string;
    cc?: string;
    replyTo?: string;
    subject: string;
    text: string;
    html?: string;
};

function parseSmtpConfig() {
    let decoded: string;
    try {
        decoded = Buffer.from(Resource.SMTP_CONFIG.value, "base64").toString("utf-8");
    } catch (error) {
        console.error("Cannot decode invalid SMTP configuration", {value: Resource.SMTP_CONFIG.value, error});
        throw error;
    }

    try {
        return JSON.parse(decoded);
    } catch (error) {
        console.error("Cannot parse invalid SMTP configuration as JSON", {decoded, error});
        throw error;
    }
}

export class EmailSender {
  private smtpConfig: SMTPConnection.Options;
  private transport: Transporter;

  constructor() {
    this.smtpConfig = parseSmtpConfig();
    this.transport = createTransport(this.smtpConfig);
  }
  
  async send(message: EmailMessage) {
    await this.transport.sendMail(message);
  }

  async test() {
    await this.transport.verify();
  }
}
