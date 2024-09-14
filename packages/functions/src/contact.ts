import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { ApiHandler } from "sst/node/api";
import { z } from "zod";
import { createTransport } from "nodemailer";
import { Config } from "sst/node/config";
import { ProblemError } from "./lib/problem";
import { wrapper } from "./lib/wrapper";

const smtpConfig = JSON.parse(
  Buffer.from(Config.SMTP_CONFIG, "base64").toString("utf-8")
);

const transport = createTransport(smtpConfig);

const ContactRequest = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(3),
  contact_by_fax_only: z.string().optional(),
});

type ContactRequestType = z.infer<typeof ContactRequest>;

export const handler = ApiHandler(
  async (
    evt: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    return wrapper(evt, async () => {
      if (!evt.body) {
        throw new ProblemError({
          status: 400,
          detail: "Missing request body",
        });
      }

      let request: ContactRequestType;
      try {
        const json = JSON.parse(evt.body);
        request = ContactRequest.parse(json);
      } catch (err) {
        console.log("Invalid request", err);
        throw new ProblemError({
          status: 400,
          detail: err,
        });
      }

      const userInfo = {
        ip: evt.requestContext.http.sourceIp,
        userAgent: evt.requestContext.http.userAgent,
        time: new Date().toISOString(),
      };

      const emailPayload = { ...request, ...userInfo };
      if(emailPayload.contact_by_fax_only) {
        console.log("Request caught in honeypot, not sending email", emailPayload);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Email sent", pooh: "bear" }),
        }
      }
      console.log("About to send email", emailPayload);

      try {
        await transport.sendMail({
          from: "tech.thecaringplace@gmail.com",
          to: "caringplc@yahoo.com",
          cc: "tech.thecaringplace@gmail.com",
          replyTo: request.email,
          subject: "TheCaringPlace.info Contact Form Submission",
          text: Object.entries({ ...request, ...userInfo })
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n"),
        });
        console.log("Email sent successfully!");
      } catch (err) {
        console.log("Failed to send email", err);
        throw new ProblemError({
          status: 500,
          detail: err,
        });
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Email sent" }),
      };
    });
  }
);
