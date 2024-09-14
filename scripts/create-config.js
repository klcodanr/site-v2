const { config } = require("dotenv");

config();

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
};

process.stdout.write(
  Buffer.from(JSON.stringify(smtpConfig)).toString("base64")
);
