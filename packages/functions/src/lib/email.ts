import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import assert from "assert";

export type EmailMessage = {
  subject: string;
  text: string;
};

const client = new SESv2Client();

export class EmailSender {
  async send(message: EmailMessage) {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: Resource.Email.sender,
        Destination: {
          ToAddresses: [Resource.Email.sender],
        },
        Content: {
          Simple: {
            Subject: { Data: message.subject },
            Body: { Text: { Data: message.text} },
          },
        },
      })
    );
  }

  async test() {
    assert(Resource.Email.sender);
  }
}
