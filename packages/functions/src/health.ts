import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { EmailSender } from "./lib/email";
import { wrapper } from "./lib/wrapper";
import { toProblemResponse } from "./lib/problem";

const checks = [
  {
    name: "smtp",
    check: async () => {
      const sender = new EmailSender();
      await sender.test();
    },
  },
];

export const handler = async (
  evt: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  return wrapper(evt, async () => {
    const results = await Promise.allSettled(
      checks.map((check) => check.check())
    );

    const failedChecks = results
      .map(({ status }, index) =>
        status === "rejected" ? checks[index].name : undefined
      )
      .filter(Boolean);

    if (failedChecks.length > 0) {
      return toProblemResponse(
        {
          status: 500,
          detail: "Failed checks: " + failedChecks.join(", "),
        },
        evt
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK", checks: checks.map((c) => c.name) }),
    };
  });
};
