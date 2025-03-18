/// <reference path="../.sst/platform/config.d.ts" />

import { email } from "./email";

const logging = {
  retention: "1 week",
} as const;

export const api = new sst.aws.ApiGatewayV2("Api", {
  accessLog: {
    retention: "1 week",
  },
  cors: true,
});
api.route("GET /health", {
  handler: "packages/functions/src/health.handler",
  link: [email],
  logging,
});
api.route("POST /contact", {
  handler: "packages/functions/src/contact.handler",
  link: [email],
  logging,
});
api.route("$default", {
  handler: "packages/functions/src/default.handler",
  logging,
});
